from __future__ import annotations

from io import BytesIO
from pathlib import Path

from cards_configurator_backend.app import create_app
from cards_configurator_backend.config import get_settings
from cards_configurator_backend.registries.loader import load_registry_bundle
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
                'category_id': 'google_reviews',
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
                'category_id': 'google_reviews',
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


def test_validation_flags_warning_and_blocking_logo_dpi(tmp_path: Path, monkeypatch) -> None:
    # The logo is the only asset field left on the template; its element `proof-logo`
    # is 28 mm wide, so effective_dpi == width_px * 25.4 / 28 at the default scale.
    # 300 px -> 272 dpi (warning band 225..300), 200 px -> 181 dpi (below the 225 minimum).
    db_path = tmp_path / 'drafts.sqlite3'
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{db_path}')

    with TestClient(create_app()) as client:
        client.post(
            '/api/drafts/current/template',
            json={
                'category_id': 'google_reviews',
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

        warning_response = client.get('/api/drafts/current/validation')
        warning_payload = warning_response.json()
        warning_issue = next(issue for issue in warning_payload['issues'] if issue['code'] == 'image_dpi_warning')

        assert warning_response.status_code == 200
        assert warning_payload['blocking'] is False
        assert warning_issue['blocking'] is False
        assert warning_issue['details']['minimum_dpi'] == 225
        assert warning_issue['details']['warning_dpi'] == 300

        blocking_asset = client.post(
            '/api/assets?kind=logo&filename=logo-blocking.png&mime_type=image/png',
            content=_png_bytes((200, 100)),
            headers={'Content-Type': 'image/png'},
        ).json()

        client.patch(
            '/api/drafts/current/layout',
            json={
                'asset_values': {'logo': blocking_asset['id']},
            },
        )

        blocking_response = client.get('/api/drafts/current/validation')
        blocking_payload = blocking_response.json()
        blocking_issue = next(issue for issue in blocking_payload['issues'] if issue['code'] == 'image_dpi_too_low')

        assert blocking_response.status_code == 200
        assert blocking_payload['blocking'] is True
        assert blocking_issue['blocking'] is True


def test_validation_blocks_small_qr_codes(tmp_path: Path, monkeypatch) -> None:
    db_path = tmp_path / 'drafts.sqlite3'
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{db_path}')

    app = create_app()
    bundle = load_registry_bundle(get_settings().registries_dir)
    template = next(template for template in bundle.templates if template.id == 'proof_a6_card' and template.version == '1.6.0')
    for element in template.elements:
        if element.kind == 'qr':
            element.box_mm.width_mm = 10
            element.box_mm.height_mm = 10

    with TestClient(app) as client:
        client.app.state.registry_bundle = bundle
        client.post(
            '/api/drafts/current/template',
            json={
                'category_id': 'google_reviews',
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
                    'headline': 'Short headline',
                    'qrTarget': 'example.com/review',
                },
            },
        )

        validation_response = client.get('/api/drafts/current/validation')
        assert validation_response.status_code == 200
        payload = validation_response.json()
        issue = next(issue for issue in payload['issues'] if issue['code'] == 'qr_too_small')

        assert payload['blocking'] is True
        assert issue['blocking'] is True
        assert issue['details']['minimum_width_mm'] == 18
        assert issue['details']['minimum_module_mm'] == 0.42
