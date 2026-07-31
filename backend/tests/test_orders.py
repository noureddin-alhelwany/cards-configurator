from __future__ import annotations

from datetime import datetime, timezone
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
        'cards_configurator_backend.rendering.jobs.render_order_artifacts',
        fake_render_order_artifacts,
    )

    with TestClient(create_app()) as client:
        expected_prefix = datetime.now(timezone.utc).strftime('ORD-%Y%m%d-')
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
        assert order_payload['order_number'].startswith(expected_prefix)
        assert order_payload['display_name'] == 'Studio One'
        assert order_payload['approved_at'] is not None
        assert order_payload['preview_path'].endswith('preview.png')
        assert order_payload['mockup_path'].endswith('preview.png')
        assert order_payload['pdf_path'].endswith('order.pdf')

        list_response = client.get('/api/orders')
        assert list_response.status_code == 200
        assert len(list_response.json()) == 1

        detail_response = client.get(f"/api/orders/{order_payload['id']}")
        assert detail_response.status_code == 200
        detail_payload = detail_response.json()
        assert detail_payload['order_number'] == order_payload['order_number']
        assert detail_payload['display_name'] == 'Studio One'
        assert detail_payload['validation_snapshot']['blocking'] is False
        assert detail_payload['assets'] == []

        preview_response = client.get(f"/api/orders/{order_payload['id']}/preview")
        assert preview_response.status_code == 200
        assert preview_response.headers['content-type'] == 'image/png'

        mockup_response = client.get(f"/api/orders/{order_payload['id']}/mockup")
        assert mockup_response.status_code == 200
        assert mockup_response.headers['content-type'] == 'image/png'

        pdf_response = client.get(f"/api/orders/{order_payload['id']}/pdf")
        assert pdf_response.status_code == 200
        assert pdf_response.headers['content-type'] == 'application/pdf'


def test_failed_rendering_can_be_retried(tmp_path: Path, monkeypatch) -> None:
    db_path = tmp_path / 'orders.sqlite3'
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{db_path}')

    render_attempts = {'count': 0}

    async def fake_render_order_artifacts(*, output_dir: Path, **_: object) -> SimpleNamespace:
        render_attempts['count'] += 1
        output_dir.mkdir(parents=True, exist_ok=True)
        if render_attempts['count'] == 1:
            raise RuntimeError('render exploded')
        preview_path = output_dir / 'preview.png'
        pdf_path = output_dir / 'order.pdf'
        preview_path.write_bytes(b'png')
        pdf_path.write_bytes(b'pdf')
        return SimpleNamespace(preview_path=str(preview_path), pdf_path=str(pdf_path))

    monkeypatch.setattr(
        'cards_configurator_backend.rendering.jobs.render_order_artifacts',
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
        assert order_response.status_code == 500

        list_response = client.get('/api/orders')
        assert list_response.status_code == 200
        orders = list_response.json()
        assert len(orders) == 1
        order_id = orders[0]['id']
        assert orders[0]['preview_path'] is None

        jobs_response = client.get(f'/api/orders/{order_id}/render-jobs')
        assert jobs_response.status_code == 200
        jobs = jobs_response.json()
        assert len(jobs) == 1
        assert jobs[0]['status'] == 'failed'
        assert jobs[0]['attempts'] == 1
        assert jobs[0]['error_code'] == 'render_failed'
        assert jobs[0]['error_message'] == 'render exploded'

        retry_response = client.post(f'/api/orders/{order_id}/render-jobs/retry')
        assert retry_response.status_code == 200
        retry_payload = retry_response.json()
        assert retry_payload['status'] == 'completed'
        assert retry_payload['attempts'] == 2

        detail_response = client.get(f'/api/orders/{order_id}')
        assert detail_response.status_code == 200
        detail_payload = detail_response.json()
        assert detail_payload['preview_path'].endswith('preview.png')
        assert detail_payload['pdf_path'].endswith('order.pdf')

        jobs_response = client.get(f'/api/orders/{order_id}/render-jobs')
        assert jobs_response.status_code == 200
        jobs = jobs_response.json()
        assert len(jobs) == 1
        assert jobs[0]['status'] == 'completed'
        assert jobs[0]['attempts'] == 2
