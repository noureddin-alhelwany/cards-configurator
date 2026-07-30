from __future__ import annotations

from pathlib import Path

import httpx
import pikepdf
import pytest


def _box_as_float_list(box: pikepdf.Array) -> list[float]:
    return [float(value) for value in box]


def test_production_pdf_pipeline_sets_boxes_and_preview(live_server: str, tmp_path: Path) -> None:
    response = httpx.post(f"{live_server}/api/render/proof", timeout=120.0)
    response.raise_for_status()
    payload = response.json()

    pdf_path = Path(payload["pdf_path"])
    preview_path = Path(payload["preview_path"])

    assert pdf_path.exists()
    assert preview_path.exists()

    with pikepdf.open(pdf_path) as pdf:
        page = pdf.pages[0]
        media_box = _box_as_float_list(page.mediabox)
        trim_box = _box_as_float_list(page.trimbox)
        bleed_box = _box_as_float_list(page.bleedbox)

    assert media_box == pytest.approx([0.0, 0.0, 314.64566929133854, 436.5354330708662], abs=0.001)
    assert trim_box == pytest.approx([8.503937007874017, 8.503937007874017, 306.14173228346456, 428.0314960629921], abs=0.001)
    assert bleed_box == pytest.approx(media_box, abs=0.001)
