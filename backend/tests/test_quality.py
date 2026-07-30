from __future__ import annotations

from pathlib import Path

from cards_configurator_backend.app import create_app
from fastapi.testclient import TestClient


def test_validation_reports_missing_required_fields(tmp_path: Path, monkeypatch) -> None:
    db_path = tmp_path / 'drafts.sqlite3'
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{db_path}')

    with TestClient(create_app()) as client:
        response = client.post(
            '/api/drafts/current/template',
            json={
                'use_case_id': 'google_reviews',
                'product_id': 'a6_card',
                'template_id': 'proof_a6_card',
                'template_version': '1.0.0',
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
                'use_case_id': 'google_reviews',
                'product_id': 'a6_card',
                'template_id': 'proof_a6_card',
                'template_version': '1.0.0',
            },
        )
        client.patch(
            '/api/drafts/current/layout',
            json={
                'text_values': {
                    'businessName': 'Studio One',
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

