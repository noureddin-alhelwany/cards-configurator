from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

from cards_configurator_backend.app import create_app
from fastapi.testclient import TestClient


def test_order_creation_persists_and_exposes_detail(tmp_path: Path, monkeypatch) -> None:
    db_path = tmp_path / 'orders.sqlite3'
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{db_path}')

    async def fake_render_order_artifacts(*, output_dir: Path, **_: object) -> SimpleNamespace:
        output_dir.mkdir(parents=True, exist_ok=True)
        preview_path = output_dir / 'preview.png'
        pdf_path = output_dir / 'order.pdf'
        preview_path.write_bytes(b'png')
        pdf_path.write_bytes(b'pdf')
        return SimpleNamespace(preview_path=str(preview_path), pdf_path=str(pdf_path))

    monkeypatch.setattr(
        'cards_configurator_backend.orders.service.render_order_artifacts',
        fake_render_order_artifacts,
    )

    with TestClient(create_app()) as client:
        template_response = client.post(
            '/api/drafts/current/template',
            json={
                'use_case_id': 'google_reviews',
                'product_id': 'a6_card',
                'template_id': 'proof_a6_card',
                'template_version': '1.0.0',
            },
        )
        assert template_response.status_code == 200

        layout_response = client.patch(
            '/api/drafts/current/layout',
            json={
                'text_values': {
                    'businessName': 'Studio One',
                    'headline': 'Leave a Google review',
                    'qrTarget': 'example.com/review',
                },
            },
        )
        assert layout_response.status_code == 200

        approval_response = client.post(
            '/api/drafts/current/approval',
            json={
                'texts_checked': True,
                'url_checked': True,
                'image_crop_checked': True,
                'preview_released': True,
            },
        )
        assert approval_response.status_code == 200

        order_response = client.post('/api/orders')
        assert order_response.status_code == 200
        order_payload = order_response.json()
        assert order_payload['order_number'].startswith('ORD-20260730-')
        assert order_payload['approved_at'] is not None
        assert order_payload['preview_path'].endswith('preview.png')
        assert order_payload['pdf_path'].endswith('order.pdf')

        list_response = client.get('/api/orders')
        assert list_response.status_code == 200
        assert len(list_response.json()) == 1

        detail_response = client.get(f"/api/orders/{order_payload['id']}")
        assert detail_response.status_code == 200
        detail_payload = detail_response.json()
        assert detail_payload['order_number'] == order_payload['order_number']
        assert detail_payload['validation_snapshot']['blocking'] is False
        assert detail_payload['assets'] == []

        preview_response = client.get(f"/api/orders/{order_payload['id']}/preview")
        assert preview_response.status_code == 200
        assert preview_response.headers['content-type'] == 'image/png'

        pdf_response = client.get(f"/api/orders/{order_payload['id']}/pdf")
        assert pdf_response.status_code == 200
        assert pdf_response.headers['content-type'] == 'application/pdf'
