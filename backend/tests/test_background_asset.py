"""Loader checks for full-bleed template artwork.

A card whose artwork is missing or too soft must not be orderable: it would print as a blank
or visibly blurry background, and nothing downstream looks at the file. Aspect drift is the
subtler failure -- the existing mockups are 2% off full-bleed geometry, which shifts the crop
rather than breaking the card, so it needs a check rather than an eyeball.
"""

from __future__ import annotations

import hashlib
import json
from io import BytesIO
from pathlib import Path

from cards_configurator_backend.registries.loader import load_registry_bundle
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]


def _write_png(path: Path, size: tuple[int, int]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    buffer = BytesIO()
    Image.new("RGB", size, (10, 40, 30)).save(buffer, format="PNG")
    path.write_bytes(buffer.getvalue())


def _build_registries(tmp_path: Path, *, background: str | None, sha256: str | None = None) -> Path:
    registries_dir = tmp_path / "registries"
    for name in ("use_cases", "products", "templates"):
        (registries_dir / name).mkdir(parents=True, exist_ok=True)

    (registries_dir / "use_cases" / "case.json").write_text(
        json.dumps(
            {
                "id": "case",
                "name": "Case",
                "description": "Case description",
                "preview_asset": "case.png",
                "active": True,
            }
        ),
        encoding="utf-8",
    )
    (registries_dir / "products" / "product.json").write_text(
        json.dumps(
            {
                "id": "product",
                "name": "Product",
                "trim_width_mm": 105,
                "trim_height_mm": 148,
                "bleed_mm": 3,
                "recommended_dpi": 450,
                "warning_dpi": 300,
                "minimum_dpi": 225,
                "qr_min_width_mm": 18,
                "qr_min_module_mm": 0.42,
                "preview_asset": "product.png",
                "active": True,
            }
        ),
        encoding="utf-8",
    )
    template: dict[str, object] = {
        "schema_version": 1,
        "id": "template",
        "version": "1.0.0",
        "product_id": "product",
        "use_case_ids": ["case"],
        "active": True,
        "page_width_mm": 111,
        "page_height_mm": 154,
        "bleed_mm": 3,
        "font_family": "Proof Sans",
        "fonts": [{"family": "Proof Sans", "file": "ProofSans.ttf", "weight": 400, "style": "normal"}],
        "fields": [],
        "elements": [
            {
                "kind": "text",
                "id": "headline",
                "box_mm": {"x_mm": 10, "y_mm": 10, "width_mm": 80, "height_mm": 20},
                "z_index": 1,
                "text": "Headline",
                "font_family": "Proof Sans",
                "font_size_mm": 6,
                "font_weight": 400,
                "color": "#1f1a17",
                "line_height": 1.1,
                "align": "left",
            }
        ],
    }
    if background is not None:
        template["background_asset"] = background
    if sha256 is not None:
        template["background_asset_sha256"] = sha256
    (registries_dir / "templates" / "template.json").write_text(json.dumps(template), encoding="utf-8")
    return registries_dir


def _codes(bundle) -> set[str]:
    return {issue.code for issue in bundle.diagnostics}


def test_a_template_without_artwork_is_unaffected(tmp_path: Path) -> None:
    """The field is optional, so the four shipped templates keep loading untouched."""
    bundle = load_registry_bundle(_build_registries(tmp_path, background=None), tmp_path / "assets")

    assert bundle.diagnostics == []
    assert [template.id for template in bundle.templates] == ["template"]
    assert bundle.templates[0].background_asset is None


def test_artwork_checks_are_skipped_without_an_assets_dir(tmp_path: Path) -> None:
    """Without a directory to look in, the loader says nothing rather than guessing."""
    registries_dir = _build_registries(tmp_path, background="missing.png")

    bundle = load_registry_bundle(registries_dir)

    assert bundle.diagnostics == []
    assert len(bundle.templates) == 1


def test_missing_artwork_removes_the_template_from_the_selection(tmp_path: Path) -> None:
    registries_dir = _build_registries(tmp_path, background="backgrounds/gone.svg")

    bundle = load_registry_bundle(registries_dir, tmp_path / "assets")

    assert _codes(bundle) == {"template_background_missing"}
    # A card that cannot draw its own background must not be orderable.
    assert bundle.templates == []


def test_a_raster_below_the_product_minimum_removes_the_template(tmp_path: Path) -> None:
    """800 x 1110 px over 111 x 154 mm is 183 dpi, under the 225 minimum."""
    assets_dir = tmp_path / "assets"
    _write_png(assets_dir / "backgrounds" / "soft.png", (800, 1110))
    registries_dir = _build_registries(tmp_path, background="backgrounds/soft.png")

    bundle = load_registry_bundle(registries_dir, assets_dir)

    assert "template_background_dpi_too_low" in _codes(bundle)
    assert bundle.templates == []
    issue = next(i for i in bundle.diagnostics if i.code == "template_background_dpi_too_low")
    assert issue.details["effective_dpi"] < 225


def test_a_raster_between_minimum_and_warning_only_warns(tmp_path: Path) -> None:
    """1100 x 1526 px is 251 dpi: printable, but below the 300 the product recommends."""
    assets_dir = tmp_path / "assets"
    _write_png(assets_dir / "backgrounds" / "ok.png", (1100, 1526))
    registries_dir = _build_registries(tmp_path, background="backgrounds/ok.png")

    bundle = load_registry_bundle(registries_dir, assets_dir)

    assert _codes(bundle) == {"template_background_dpi_warning"}
    assert [issue.blocking for issue in bundle.diagnostics] == [False]
    assert len(bundle.templates) == 1


def test_a_sharp_full_bleed_raster_passes(tmp_path: Path) -> None:
    """1312 x 1820 px clears 300 dpi over 111 x 154 mm (1311 x 1819 lands at 299.98)."""
    assets_dir = tmp_path / "assets"
    _write_png(assets_dir / "backgrounds" / "sharp.png", (1312, 1820))
    registries_dir = _build_registries(tmp_path, background="backgrounds/sharp.png")

    bundle = load_registry_bundle(registries_dir, assets_dir)

    assert bundle.diagnostics == []
    assert len(bundle.templates) == 1


def test_the_existing_mockups_would_be_rejected(tmp_path: Path) -> None:
    """1054 x 1492 px: 241 dpi and 2% off the full-bleed aspect -- both fire.

    This is the acceptance test for the rule itself: the flat mockups in the repo look like
    finished cards, and they are exactly what must not become full-bleed artwork.
    """
    assets_dir = tmp_path / "assets"
    _write_png(assets_dir / "backgrounds" / "mockup.png", (1054, 1492))
    registries_dir = _build_registries(tmp_path, background="backgrounds/mockup.png")

    bundle = load_registry_bundle(registries_dir, assets_dir)

    assert _codes(bundle) == {"template_background_dpi_warning", "template_background_aspect_mismatch"}
    aspect = next(i for i in bundle.diagnostics if i.code == "template_background_aspect_mismatch")
    assert aspect.details["deviation"] > 0.01
    # 2% shifts the crop; it does not ruin the card, so the template stays selectable.
    assert aspect.blocking is False
    assert len(bundle.templates) == 1


def test_a_badly_proportioned_raster_removes_the_template(tmp_path: Path) -> None:
    """A square image over a 111 x 154 mm page is 39% off: `cover` would crop away a third."""
    assets_dir = tmp_path / "assets"
    _write_png(assets_dir / "backgrounds" / "square.png", (1400, 1400))
    registries_dir = _build_registries(tmp_path, background="backgrounds/square.png")

    bundle = load_registry_bundle(registries_dir, assets_dir)

    aspect = next(i for i in bundle.diagnostics if i.code == "template_background_aspect_mismatch")
    assert aspect.blocking is True
    assert bundle.templates == []


def test_vector_artwork_is_not_measured_in_dpi(tmp_path: Path) -> None:
    """Chrome embeds SVG in an <img> as path operators, so it has no resolution to check."""
    assets_dir = tmp_path / "assets"
    (assets_dir / "backgrounds").mkdir(parents=True)
    (assets_dir / "backgrounds" / "art.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 111 154"><rect width="111" height="154"/></svg>',
        encoding="utf-8",
    )
    registries_dir = _build_registries(tmp_path, background="backgrounds/art.svg")

    bundle = load_registry_bundle(registries_dir, assets_dir)

    assert bundle.diagnostics == []
    assert len(bundle.templates) == 1


def test_replaced_artwork_trips_the_digest_wire(tmp_path: Path) -> None:
    """Orders re-render from a snapshot through the same URL, so a swap is retroactive.

    The digest cannot prevent that -- it makes it visible, which is what the versioned
    filename convention is there to avoid in the first place.
    """
    assets_dir = tmp_path / "assets"
    artwork = assets_dir / "backgrounds" / "art.svg"
    artwork.parent.mkdir(parents=True)
    artwork.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 111 154"/>', encoding="utf-8")
    declared = hashlib.sha256(artwork.read_bytes()).hexdigest()
    registries_dir = _build_registries(tmp_path, background="backgrounds/art.svg", sha256=declared)

    assert load_registry_bundle(registries_dir, assets_dir).diagnostics == []

    artwork.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 111 154"><rect/></svg>', encoding="utf-8")
    bundle = load_registry_bundle(registries_dir, assets_dir)

    changed = next(i for i in bundle.diagnostics if i.code == "template_background_changed")
    assert changed.blocking is False
    assert changed.details["expected_sha256"] == declared
    assert changed.details["actual_sha256"] != declared
    # A warning, not a refusal: the running shop keeps working while someone looks.
    assert len(bundle.templates) == 1


def test_the_shipped_registries_load_without_diagnostics() -> None:
    """The CI gate from the plan: the real registries plus the real asset directory."""
    bundle = load_registry_bundle(REPO_ROOT / "registries", REPO_ROOT / "proof-assets")

    assert bundle.diagnostics == []
    assert bundle.templates
