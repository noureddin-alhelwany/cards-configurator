from __future__ import annotations

import json
from pathlib import Path

from cards_configurator_backend.app import create_app
from cards_configurator_backend.config import get_settings
from cards_configurator_backend.registries.loader import load_registry_bundle
from fastapi.testclient import TestClient


def test_valid_registry_bundle_loads(tmp_path: Path) -> None:
    registries_dir = tmp_path / "registries"
    (registries_dir / "use_cases").mkdir(parents=True)
    (registries_dir / "products").mkdir(parents=True)
    (registries_dir / "templates").mkdir(parents=True)

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
    (registries_dir / "templates" / "template.json").write_text(
        json.dumps(
            {
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
                "fonts": [{"family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
                "elements": [],
                "variants": [{"id": "proof", "name": "Proof", "active": True}],
            }
        ),
        encoding="utf-8",
    )

    bundle = load_registry_bundle(registries_dir)

    assert [use_case.id for use_case in bundle.use_cases] == ["case"]
    assert [product.id for product in bundle.products] == ["product"]
    assert [template.id for template in bundle.templates] == ["template"]
    assert bundle.diagnostics == []


def test_invalid_registry_bundle_is_reported(tmp_path: Path) -> None:
    registries_dir = tmp_path / "registries"
    (registries_dir / "use_cases").mkdir(parents=True)
    (registries_dir / "products").mkdir(parents=True)
    (registries_dir / "templates").mkdir(parents=True)

    (registries_dir / "use_cases" / "broken.json").write_text("{\"id\": \"broken\"}", encoding="utf-8")
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
    (registries_dir / "templates" / "template.json").write_text(
        json.dumps(
            {
                "schema_version": 1,
                "id": "template",
                "version": "1.0.0",
                "product_id": "product",
                "use_case_ids": ["broken"],
                "active": True,
                "page_width_mm": 111,
                "page_height_mm": 154,
                "bleed_mm": 3,
                "font_family": "Proof Sans",
                "fonts": [{"family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
                "elements": [],
                "variants": [{"id": "proof", "name": "Proof", "active": True}],
            }
        ),
        encoding="utf-8",
    )

    bundle = load_registry_bundle(registries_dir)

    assert bundle.use_cases == []
    assert bundle.templates == []
    assert any(issue.code == "registry_schema_invalid" for issue in bundle.diagnostics)
    assert any(issue.code == "template_unknown_use_case" for issue in bundle.diagnostics)


def test_duplicate_template_versions_are_rejected(tmp_path: Path) -> None:
    registries_dir = tmp_path / "registries"
    (registries_dir / "use_cases").mkdir(parents=True)
    (registries_dir / "products").mkdir(parents=True)
    (registries_dir / "templates").mkdir(parents=True)

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
    template = {
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
        "fonts": [{"family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
        "elements": [],
        "variants": [{"id": "proof", "name": "Proof", "active": True}],
    }
    (registries_dir / "templates" / "template-a.json").write_text(json.dumps(template), encoding="utf-8")
    (registries_dir / "templates" / "template-b.json").write_text(json.dumps(template), encoding="utf-8")

    bundle = load_registry_bundle(registries_dir)

    assert [template.id for template in bundle.templates] == ["template"]
    assert any(issue.code == "duplicate_template_version" for issue in bundle.diagnostics)


def test_app_loads_registries_on_startup(tmp_path: Path, monkeypatch) -> None:
    registries_dir = tmp_path / "registries"
    (registries_dir / "use_cases").mkdir(parents=True)
    (registries_dir / "products").mkdir(parents=True)
    (registries_dir / "templates").mkdir(parents=True)

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
    (registries_dir / "templates" / "template.json").write_text(
        json.dumps(
            {
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
                "fonts": [{"family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
                "elements": [],
                "variants": [{"id": "proof", "name": "Proof", "active": True}],
            }
        ),
        encoding="utf-8",
    )

    monkeypatch.setenv("REGISTRIES_DIR", str(registries_dir))
    get_settings.cache_clear()

    app = create_app()

    with TestClient(app):
        bundle = app.state.registry_bundle
        assert len(bundle.use_cases) == 1
        assert len(bundle.products) == 1
        assert len(bundle.templates) == 1
