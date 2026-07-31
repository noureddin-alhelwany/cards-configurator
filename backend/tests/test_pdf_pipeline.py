from __future__ import annotations

from pathlib import Path

import httpx
import pikepdf
import pytest


def _box_as_float_list(box: pikepdf.Array) -> list[float]:
    return [float(value) for value in box]


def test_production_pdf_pipeline_sets_boxes_and_preview(
    live_server: str, chromium_available: None, tmp_path: Path
) -> None:
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


def test_order_pdf_pipeline_sets_boxes_preview_and_pdf(
    live_server: str, chromium_available: None, tmp_path: Path
) -> None:
    draft_response = httpx.get(f"{live_server}/api/drafts/current", timeout=120.0)
    draft_response.raise_for_status()
    draft_payload = draft_response.json()

    if draft_payload['approved_at'] is None:
        template_response = httpx.post(
            f"{live_server}/api/drafts/current/template",
            json={
                'use_case_id': 'google_reviews',
                'product_id': 'a6_card',
                'template_id': 'proof_a6_card',
                'template_version': '1.2.0',
            },
            timeout=120.0,
        )
        template_response.raise_for_status()

        layout_response = httpx.patch(
            f"{live_server}/api/drafts/current/layout",
            json={
                'text_values': {
                    'businessName': 'Studio One',
                    'headline': 'Leave a Google review',
                    'qrTarget': 'example.com/review',
                },
            },
            timeout=120.0,
        )
        layout_response.raise_for_status()

        approval_response = httpx.post(
            f"{live_server}/api/drafts/current/approval",
            json={
                'texts_checked': True,
                'url_checked': True,
                'image_crop_checked': True,
                'preview_released': True,
            },
            timeout=120.0,
        )
        approval_response.raise_for_status()

    order_response = httpx.post(f"{live_server}/api/orders", timeout=180.0)
    order_response.raise_for_status()
    order_payload = order_response.json()

    preview_path = Path(order_payload['preview_path'])
    pdf_path = Path(order_payload['pdf_path'])

    assert preview_path.exists()
    assert pdf_path.exists()

    pdf_download = httpx.get(f"{live_server}/api/orders/{order_payload['id']}/pdf", timeout=120.0)
    pdf_download.raise_for_status()
    assert pdf_download.headers['content-type'] == 'application/pdf'

    with pikepdf.open(pdf_path) as pdf:
        page = pdf.pages[0]
        media_box = _box_as_float_list(page.mediabox)
        trim_box = _box_as_float_list(page.trimbox)
        bleed_box = _box_as_float_list(page.bleedbox)

    assert media_box == pytest.approx([0.0, 0.0, 314.64566929133854, 436.5354330708662], abs=0.001)
    assert trim_box == pytest.approx([8.503937007874017, 8.503937007874017, 306.14173228346456, 428.0314960629921], abs=0.001)
    assert bleed_box == pytest.approx(media_box, abs=0.001)
