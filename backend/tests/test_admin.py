from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

from cards_configurator_backend.app import create_app
from cards_configurator_backend.config import get_settings
from cards_configurator_backend.db import get_session_factory
from cards_configurator_backend.models import (
    OrderAssetRecord,
    OrderRecord,
    RenderJobRecord,
)
from fastapi.testclient import TestClient


def _write_valid_registries(registries_dir: Path) -> None:
    (registries_dir / "categories").mkdir(parents=True)
    (registries_dir / "products").mkdir(parents=True)
    (registries_dir / "templates").mkdir(parents=True)

    (registries_dir / "categories" / "category.json").write_text(
        json.dumps(
            {
                "id": "category",
                "name": "Category",
                "description": "Category description",
                "preview_asset": "category.png",
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
                "category_ids": ["category"],
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
    (registries_dir / "templates" / "template.json").write_text(
        json.dumps(
            {
                "schema_version": 1,
                "id": "template",
                "version": "1.0.0",
                "name": "Template",
                "product_id": "product",
                "active": True,
                "page_width_mm": 111,
                "page_height_mm": 154,
                "bleed_mm": 3,
                "fonts": [],
                "safe_areas": [],
                "text_rules": [],
                "qr_rules": [],
                "elements": [],
                "variants": [{"id": "default", "name": "Default", "active": True}],
            }
        ),
        encoding="utf-8",
    )


def test_admin_data_registry_and_delete_routes(tmp_path: Path, monkeypatch) -> None:
    registries_dir = tmp_path / "registries"
    proof_assets_dir = tmp_path / "proof-assets"
    data_dir = tmp_path / "data"
    proof_assets_dir.mkdir()
    data_dir.mkdir()
    _write_valid_registries(registries_dir)

    monkeypatch.setenv("REGISTRIES_DIR", str(registries_dir))
    monkeypatch.setenv("PROOF_ASSETS_DIR", str(proof_assets_dir))
    monkeypatch.setenv("DATA_DIR", str(data_dir))
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{data_dir / 'cards-configurator.sqlite3'}")
    get_settings.cache_clear()

    with TestClient(create_app()) as client:
        response = client.get("/api/admin/data")
        assert response.status_code == 200
        payload = response.json()
        assert len(payload["registries"]) == 3
        assert payload["registries"][2]["title"] == "Template"

        file_response = client.get("/api/admin/registries/template/template.json")
        assert file_response.status_code == 200
        assert file_response.json()["content"].startswith("{")

        updated_content = json.dumps(
            {
                "schema_version": 1,
                "id": "template",
                "version": "1.0.0",
                "name": "Template renamed",
                "product_id": "product",
                "active": True,
                "page_width_mm": 111,
                "page_height_mm": 154,
                "bleed_mm": 3,
                "fonts": [],
                "safe_areas": [],
                "text_rules": [],
                "qr_rules": [],
                "elements": [],
                "variants": [{"id": "default", "name": "Default", "active": True}],
            }
        )
        write_response = client.put("/api/admin/registries/template/template.json", json={"content": updated_content})
        assert write_response.status_code == 200
        assert write_response.json()["content"] == updated_content

        refreshed = client.get("/api/admin/data").json()
        assert refreshed["registries"][2]["title"] == "Template renamed"

        session = get_session_factory()()
        try:
            order = OrderRecord(
                id="order-1",
                order_number="ORD-20260804-AAAAAA",
                display_name="Order 1",
                category_id="category",
                product_id="product",
                template_id="template",
                template_version="1.0.0",
                variant_id="default",
                category_snapshot={"id": "category", "name": "Category"},
                product_snapshot={"id": "product", "name": "Product"},
                template_snapshot={"id": "template", "version": "1.0.0", "name": "Template renamed"},
                layout_snapshot={"variant_id": "default", "text_values": {}, "asset_values": {}, "element_adjustments": {}},
                validation_snapshot={"blocking": False},
                preview_path=None,
                mockup_path=None,
                pdf_path=None,
                render_engine_version="1",
                approved_at=datetime.now(UTC),
            )
            session.add(order)
            session.add(
                RenderJobRecord(
                    id="job-1",
                    order_id="order-1",
                    kind="preview",
                    status="done",
                    attempts=1,
                    error_code=None,
                    error_message=None,
                    output_path=None,
                    started_at=None,
                    completed_at=None,
                )
            )
            session.add(OrderAssetRecord(order_id="order-1", asset_id="asset-1", semantic_role="logo"))
            session.commit()
        finally:
            session.close()

        asset_dir = data_dir / "assets" / "asset-1"
        asset_dir.mkdir(parents=True)
        (asset_dir / "metadata.json").write_text(
            json.dumps(
                {
                    "kind": "logo",
                    "original_filename": "logo.png",
                    "mime_type": "image/png",
                    "sha256": "abc",
                    "preview_path": "preview.png",
                    "render_path": "render.png",
                    "original_path": "original.png",
                }
            ),
            encoding="utf-8",
        )

        order_delete = client.delete("/api/admin/orders/order-1")
        assert order_delete.status_code == 200

        asset_delete = client.delete("/api/admin/assets/asset-1")
        assert asset_delete.status_code == 200

        delete_response = client.delete("/api/admin/registries/template/template.json")
        assert delete_response.status_code == 200

        final_payload = client.get("/api/admin/data").json()
        assert len(final_payload["registries"]) == 2
