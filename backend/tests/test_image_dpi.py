"""Effective print resolution of an uploaded image.

Two bugs are pinned down here.

1. The old formula used the width axis alone. For `contain` that is merely conservative, but
   for `cover` it **over-reports**: the overflowing axis is cropped away, so the sparser axis
   decides. A 1000x300 photo in a 60x40mm cover box prints at 190 dpi and was waved through
   as 423 dpi.
2. The gate read the raw stored `scale` while the renderer clamps to the element's range, so
   validator and renderer disagreed about the very same card. The clamp now lives in the
   shared helper -- and `update_layout_state` no longer persists a value outside the range.
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

import pytest
from cards_configurator_backend.app import create_app
from cards_configurator_backend.quality import (
    effective_image_dpi,
    effective_image_scale,
)
from cards_configurator_backend.registries.schemas import (
    BoxMm,
    ElementAdjustment,
    ImageElementDefinition,
)
from fastapi.testclient import TestClient
from PIL import Image


def _element(*, fit: str, width_mm: float, height_mm: float, max_scale: float = 1.5) -> ImageElementDefinition:
    return ImageElementDefinition(
        kind="image",
        id="photo",
        box_mm=BoxMm(x_mm=0, y_mm=0, width_mm=width_mm, height_mm=height_mm),
        z_index=1,
        asset_key="photo",
        alt="Photo",
        fit=fit,  # type: ignore[arg-type]
        max_scale=max_scale,
    )


def _png_bytes(size: tuple[int, int]) -> bytes:
    image = Image.new("RGB", size, (255, 0, 0))
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_cover_is_decided_by_the_cropped_axis() -> None:
    """The case the plan measured: waved through at 423 dpi, really printed at 190."""
    element = _element(fit="cover", width_mm=60, height_mm=40)
    dpi, details = effective_image_dpi(element, ElementAdjustment(), 1000, 300)

    assert details["dpi_x"] == pytest.approx(423.33, abs=0.01)
    assert details["dpi_y"] == pytest.approx(190.5, abs=0.01)
    assert dpi == pytest.approx(190.5, abs=0.01)
    # 190 dpi is below every product minimum in the registry (the lowest is 225).
    assert dpi < 225


def test_contain_is_decided_by_the_denser_axis() -> None:
    """Checked against a real Chrome artefact: 320x160px logo, 28mm box, scale 1.02.

    The PDF places it at 28.6mm -> 284.6 dpi, which is the width axis, not the height axis.
    """
    element = _element(fit="contain", width_mm=28, height_mm=28)
    dpi, details = effective_image_dpi(element, ElementAdjustment(scale=1.02), 320, 160)

    assert details["dpi_x"] == pytest.approx(284.59, abs=0.05)
    assert details["dpi_y"] == pytest.approx(142.29, abs=0.05)
    assert dpi == pytest.approx(284.59, abs=0.05)


def test_a_vector_upload_without_a_pixel_height_falls_back_to_the_width_axis() -> None:
    element = _element(fit="cover", width_mm=60, height_mm=40)
    dpi, details = effective_image_dpi(element, ElementAdjustment(), 1000, None)

    assert details["dpi_y"] is None
    assert dpi == pytest.approx(423.33, abs=0.01)


def test_the_reported_dpi_uses_the_scale_the_renderer_applies() -> None:
    """A stored `scale: 3.0` against `max_scale: 1.2` used to compute a DPI 2.5x too low."""
    element = _element(fit="contain", width_mm=28, height_mm=28, max_scale=1.2)
    adjustment = ElementAdjustment(scale=3.0)

    assert effective_image_scale(element, adjustment) == pytest.approx(1.2)

    dpi, details = effective_image_dpi(element, adjustment, 320, 320)
    clamped_dpi, _ = effective_image_dpi(element, ElementAdjustment(scale=1.2), 320, 320)

    assert details["requested_scale"] == pytest.approx(3.0)
    assert details["applied_scale"] == pytest.approx(1.2)
    assert dpi == pytest.approx(clamped_dpi)


def test_layout_patch_clamps_adjustments_to_what_the_renderer_can_draw(tmp_path: Path, monkeypatch) -> None:
    """A direct PATCH must not persist geometry the renderer would ignore.

    Without the clamp the draft stored `scale: 50` while the card was drawn at 1.2, so the
    quality gate measured a card that does not exist and the DPI gate was defeatable.
    """
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'drafts.sqlite3'}")

    with TestClient(create_app()) as client:
        client.post(
            "/api/drafts/current/template",
            json={
                "use_case_id": "google_reviews",
                "product_id": "a6_card",
                "template_id": "proof_a6_card",
                "template_version": "1.2.0",
            },
        )

        response = client.patch(
            "/api/drafts/current/layout",
            json={
                "element_adjustments": {
                    # proof-logo declares min_scale 0.7 / max_scale 1.2.
                    "proof-logo": {"offset_x": 9.0, "offset_y": -4.0, "scale": 50.0},
                    # Not an element of this template at all.
                    "does-not-exist": {"offset_x": 0.0, "offset_y": 0.0, "scale": 1.0},
                },
            },
        )
        assert response.status_code == 200

        adjustments = response.json()["layout_state"]["element_adjustments"]
        assert set(adjustments) == {"proof-logo"}
        assert adjustments["proof-logo"] == {"offset_x": 1.0, "offset_y": -1.0, "scale": 1.2}


def test_a_defeated_dpi_gate_stays_blocking_after_the_clamp(tmp_path: Path, monkeypatch) -> None:
    """End to end: the upload is too small, and zooming out on paper cannot rescue it.

    A 150x150px logo drawn at the 0.7 floor covers 19.6mm -> 194 dpi, below the 225 minimum.
    Claiming `scale: 0.1` would shrink the printed size to 2.8mm and report 1360 dpi -- but
    the renderer never draws below `min_scale`, so the clamp keeps the finding blocking.
    """
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'drafts.sqlite3'}")

    with TestClient(create_app()) as client:
        client.post(
            "/api/drafts/current/template",
            json={
                "use_case_id": "google_reviews",
                "product_id": "a6_card",
                "template_id": "proof_a6_card",
                "template_version": "1.2.0",
            },
        )
        asset = client.post(
            "/api/assets?kind=logo&filename=small.png&mime_type=image/png",
            content=_png_bytes((150, 150)),
            headers={"Content-Type": "image/png"},
        ).json()
        client.patch(
            "/api/drafts/current/layout",
            json={
                "text_values": {
                    "businessName": "Studio One",
                    "headline": "Short headline",
                    "qrTarget": "example.com/review",
                },
                "asset_values": {"logo": asset["id"]},
                "element_adjustments": {"proof-logo": {"offset_x": 0.0, "offset_y": 0.0, "scale": 0.1}},
            },
        )

        payload = client.get("/api/drafts/current/validation").json()
        issue = next(issue for issue in payload["issues"] if issue["code"] == "image_dpi_too_low")

        assert issue["blocking"] is True
        # Both scales read 0.7: the write clamp means the gate never even sees the 0.1, so
        # there is no window in which validator and renderer could describe different cards.
        assert issue["details"]["applied_scale"] == pytest.approx(0.7)
        assert issue["details"]["requested_scale"] == pytest.approx(0.7)
        assert issue["details"]["effective_dpi"] == pytest.approx(194.39, abs=0.5)
        assert payload["blocking"] is True
