from __future__ import annotations

from pathlib import Path

from cards_configurator_backend.app import create_app
from fastapi.testclient import TestClient
from cards_configurator_backend.drafts.service import _normalize_layout_text_values
from cards_configurator_backend.registries.schemas import (
    BoxMm,
    QrZoneDefinition,
    TemplateDefinition,
    TemplateDesignDefinition,
    TemplateFieldDefinition,
    ZoneDefinition,
    ZoneVariableDefinition,
)


def test_template_selection_is_persisted(tmp_path: Path, monkeypatch) -> None:
    db_path = tmp_path / 'drafts.sqlite3'
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{db_path}')

    with TestClient(create_app()) as client:
        draft_response = client.get('/api/drafts/current')
        assert draft_response.status_code == 200
        draft = draft_response.json()
        assert draft['template_id'] is None
        assert draft['design_id'] is None
        assert draft['updated_at'] is not None

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
        payload = response.json()
        assert payload['template_id'] == 'proof_a6_card'
        assert payload['template_version'] == '1.6.0'
        # The host template auto-selects its first active design.
        assert payload['design_id'] == 'warm'
        assert payload['layout_state']['design_id'] == 'warm'

        layout_response = client.patch(
            '/api/drafts/current/layout',
            json={
                'text_values': {'businessName': 'Studio One'},
                'element_adjustments': {
                    'proof-logo': {'offset_x': 0.25, 'offset_y': -0.1, 'scale': 1.1},
                },
            },
        )
        assert layout_response.status_code == 200
        layout_payload = layout_response.json()
        assert layout_payload['design_id'] == 'warm'
        assert layout_payload['layout_state']['design_id'] == 'warm'
        assert layout_payload['layout_state']['text_values']['businessName'] == 'Studio One'
        assert layout_payload['layout_state']['element_adjustments']['proof-logo']['offset_x'] == 0.25
        assert layout_payload['layout_state']['element_adjustments']['proof-logo']['scale'] == 1.1

        refreshed = client.get('/api/drafts/current')
        assert refreshed.status_code == 200
        refreshed_payload = refreshed.json()
        assert refreshed_payload['template_id'] == 'proof_a6_card'
        assert refreshed_payload['template_version'] == '1.6.0'
        assert refreshed_payload['design_id'] == 'warm'
        assert refreshed_payload['layout_state']['text_values']['businessName'] == 'Studio One'
        assert refreshed_payload['layout_state']['element_adjustments']['proof-logo']['offset_y'] == -0.1
        assert refreshed_payload['updated_at'] is not None


def test_current_draft_survives_reload(tmp_path: Path, monkeypatch) -> None:
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
                },
            },
        )

    with TestClient(create_app()) as reloaded_client:
        refreshed = reloaded_client.get('/api/drafts/current')
        assert refreshed.status_code == 200
        refreshed_payload = refreshed.json()
        assert refreshed_payload['template_id'] == 'proof_a6_card'
        assert refreshed_payload['layout_state']['text_values']['businessName'] == 'Studio One'
        assert refreshed_payload['updated_at'] is not None


def test_url_values_are_normalized_and_qr_preview_is_generated(tmp_path: Path, monkeypatch) -> None:
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

        response = client.patch(
            '/api/drafts/current/layout',
            json={
                'text_values': {'qrTarget': 'example.com/review'},
            },
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload['layout_state']['text_values']['qrTarget'] == 'https://example.com/review'

        qr_response = client.get('/api/qr', params={'value': 'example.com/review'})
        assert qr_response.status_code == 200
        qr_payload = qr_response.json()
        assert qr_payload['value'] == 'https://example.com/review'
        assert qr_payload['data_url'].startswith('data:image/svg+xml;base64,')


def test_static_zones_override_customer_input_before_validation() -> None:
    template = TemplateDefinition(
        schema_version=1,
        id='proof_a6_card',
        version='1.6.0',
        name='Google Reviews',
        description=None,
        product_id='a6_card',
        active=True,
        page_width_mm=111,
        page_height_mm=154,
        bleed_mm=3,
        fields=[
            TemplateFieldDefinition(
                id='headline',
                type='text',
                required=True,
                max_length=60,
                max_lines=3,
                label='Überschrift',
                help_text=None,
                group='Texte',
                placeholder=None,
                suggestions=[],
                default_value='Scanne den QR-Code',
            ),
            TemplateFieldDefinition(
                id='qrTarget',
                type='url',
                required=True,
                max_length=None,
                max_lines=None,
                label='Link',
                help_text=None,
                group='Link und QR',
                placeholder=None,
                suggestions=[],
                default_value=None,
            ),
        ],
        text_rules=[],
        qr_rules=[],
        elements=[],
        designs=[
            TemplateDesignDefinition(
                id='warm',
                name='Warm',
                active=True,
                preview_asset=None,
                source_asset=None,
                background_asset=None,
                accent_color=None,
                fonts=[
                    {
                        'id': 'proof-sans',
                        'family': 'Proof Sans',
                        'file': '/fonts/ProofSans.ttf',
                        'weight': 400,
                        'style': 'normal',
                    }
                ],
                zones=[
                    ZoneDefinition(
                        id='headline-zone',
                        box_mm=BoxMm(x_mm=0, y_mm=0, width_mm=10, height_mm=10),
                        label='Headline',
                        kind='text',
                        personalizable=False,
                        qr=None,
                        variables=[
                            ZoneVariableDefinition(
                                id='headline-zone-variable',
                                kind='text',
                                field_id='headline',
                                label='Headline',
                                font_family_id='proof-sans',
                                font_weight=700,
                                font_size_mm=4.0,
                                min_font_size_mm=None,
                                line_height=1.0,
                                letter_spacing_em=0.08,
                                color='#000000',
                                align='left',
                                max_length=60,
                                max_lines=3,
                                required=True,
                                default_value='Fixer Text',
                            )
                        ],
                    ),
                    ZoneDefinition(
                        id='qr-zone',
                        box_mm=BoxMm(x_mm=0, y_mm=0, width_mm=10, height_mm=10),
                        label='QR',
                        kind='qr',
                        personalizable=True,
                        qr=QrZoneDefinition(),
                        variables=[],
                    ),
                ],
            )
        ],
    )

    normalized = _normalize_layout_text_values(template, 'warm', {'headline': 'Customer input', 'qrTarget': 'example.com/review'})

    assert normalized['headline'] == 'Fixer Text'
    assert normalized['qrTarget'] == 'https://example.com/review'


def test_design_approval_locks_the_draft(tmp_path: Path, monkeypatch) -> None:
    db_path = tmp_path / 'drafts.sqlite3'
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{db_path}')

    with TestClient(create_app()) as client:
        template_response = client.post(
            '/api/drafts/current/template',
            json={
                'category_id': 'cat-1',
                'product_id': 'a6_card',
                'template_id': 'proof_a6_card',
                'template_version': '1.6.0',
            },
        )
        assert template_response.status_code == 200

        layout_response = client.patch(
            '/api/drafts/current/layout',
            json={
                'text_values': {
                    'businessName': 'Studio One',
                    'headline': 'Leave a Google review',
                    'body': 'Bewerte uns gern.',
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
        approval_payload = approval_response.json()
        assert approval_payload['approved_at'] is not None
        assert approval_payload['approval_checklist'] == {
            'texts_checked': True,
            'url_checked': True,
            'image_crop_checked': True,
            'preview_released': True,
        }
        assert approval_payload['approval_snapshot']['template_id'] == 'proof_a6_card'

        locked_layout_response = client.patch(
            '/api/drafts/current/layout',
            json={
                'text_values': {
                    'businessName': 'Another Studio',
                },
            },
        )
        assert locked_layout_response.status_code == 409

        # Approval must still block any later template change on the same draft.
        locked_template_response = client.post(
            '/api/drafts/current/template',
            json={
                'category_id': 'cat-1',
                'product_id': 'a6_card',
                'template_id': 'proof_a6_card',
                'template_version': '1.6.0',
            },
        )
        assert locked_template_response.status_code == 409

        reset_response = client.post('/api/drafts/current/reset')
        assert reset_response.status_code == 200
        reset_payload = reset_response.json()
        assert reset_payload['approved_at'] is None
        assert reset_payload['approval_snapshot'] is None
        assert reset_payload['approval_checklist'] is None
        assert reset_payload['template_id'] is None
        assert reset_payload['template_version'] is None
        assert reset_payload['design_id'] is None

        unlocked_template_response = client.post(
            '/api/drafts/current/template',
            json={
                'category_id': 'cat-1',
                'product_id': 'a6_card',
                'template_id': 'proof_a6_card',
                'template_version': '1.6.0',
            },
        )
        assert unlocked_template_response.status_code == 200
