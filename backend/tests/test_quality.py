from __future__ import annotations

from io import BytesIO
from pathlib import Path

from cards_configurator_backend.app import create_app
from fastapi.testclient import TestClient
from PIL import Image


def _png_bytes(size: tuple[int, int]) -> bytes:
    image = Image.new('RGB', size, (255, 0, 0))
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    return buffer.getvalue()


def test_validation_reports_missing_required_fields(tmp_path: Path, monkeypatch) -> None:
    db_path = tmp_path / 'drafts.sqlite3'
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{db_path}')

    with TestClient(create_app()) as client:
        response = client.post(
            '/api/drafts/current/template',
            json={
                'category_id': 'cat-1',
                'product_id': 'a6_card',
                'template_id': 'proof_a6_card',
                'template_version': '1.6.0',
            },
        )
        assert response.status_code == 200

        validation_response = client.get('/api/drafts/current/validation')
        assert validation_response.status_code == 200
        payload = validation_response.json()
        codes = {issue['code'] for issue in payload['issues']}

        assert payload['blocking'] is True
        assert 'required_field_missing' in codes


def test_validation_reports_text_overflow(tmp_path: Path, monkeypatch) -> None:
    db_path = tmp_path / 'drafts.sqlite3'
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{db_path}')

    with TestClient(create_app()) as client:
        client.post(
            '/api/drafts/current/template',
            json={
                'category_id': 'cat-1',
                'product_id': 'a6_card',
                'template_id': 'proof_a6_card',
                'template_version': '1.6.0',
            },
        )
        client.patch(
            '/api/drafts/current/layout',
            json={
                'text_values': {
                    'businessName': 'Studio One',
                    'body': 'Kurz und klar.',
                    'headline': 'This is an intentionally long headline that should overflow the available text box significantly and trigger validation warnings.',
                    'qrTarget': 'example.com/review',
                },
            },
        )

        validation_response = client.get('/api/drafts/current/validation')
        assert validation_response.status_code == 200
        payload = validation_response.json()
        codes = {issue['code'] for issue in payload['issues']}

        assert 'text_overflow' in codes or 'text_too_long' in codes


def test_validation_does_not_emit_removed_quality_thresholds(tmp_path: Path, monkeypatch) -> None:
    db_path = tmp_path / 'drafts.sqlite3'
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{db_path}')

    with TestClient(create_app()) as client:
        client.post(
            '/api/drafts/current/template',
            json={
                'category_id': 'cat-1',
                'product_id': 'a6_card',
                'template_id': 'proof_a6_card',
                'template_version': '1.6.0',
            },
        )

        warning_asset = client.post(
            '/api/assets?kind=logo&filename=logo-warning.png&mime_type=image/png',
            content=_png_bytes((300, 150)),
            headers={'Content-Type': 'image/png'},
        ).json()

        client.patch(
            '/api/drafts/current/layout',
            json={
                'text_values': {
                    'businessName': 'Studio One',
                    'body': 'Kurz und klar.',
                    'headline': 'Short headline',
                    'qrTarget': 'example.com/review',
                },
                'asset_values': {'logo': warning_asset['id']},
            },
        )

        validation_response = client.get('/api/drafts/current/validation')
        assert validation_response.status_code == 200
        payload = validation_response.json()
        codes = {issue['code'] for issue in payload['issues']}

        assert payload['blocking'] is False
        assert 'qr_quiet_zone_too_small' not in codes
        assert 'qr_contrast_too_low' not in codes
        assert 'image_dpi_warning' not in codes
        assert 'image_dpi_too_low' not in codes
        assert 'qr_too_small' not in codes
