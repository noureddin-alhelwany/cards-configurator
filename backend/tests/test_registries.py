from __future__ import annotations

import json
from pathlib import Path

from cards_configurator_backend.app import create_app
from cards_configurator_backend.config import get_settings
from cards_configurator_backend.registries.loader import load_registry_bundle
from fastapi.testclient import TestClient


def test_valid_registry_bundle_loads(tmp_path: Path) -> None:
    registries_dir = tmp_path / "registries"
    (registries_dir / "categories").mkdir(parents=True)
    (registries_dir / "products").mkdir(parents=True)
    (registries_dir / "templates").mkdir(parents=True)

    (registries_dir / "categories" / "case.json").write_text(
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
                "category_ids": ["case"],
                "active": True,
                "page_width_mm": 111,
                "page_height_mm": 154,
                "bleed_mm": 3,
                "reference_asset": "reference/template-reference.svg",
                "safe_areas": [
                    {
                        "id": "content-safe-area",
                        "box_mm": {
                            "x_mm": 8,
                            "y_mm": 8,
                            "width_mm": 95,
                            "height_mm": 138,
                        },
                        "label": "Content safe area",
                        "variables": [
                            {
                                "id": "headline",
                                "kind": "text",
                                "field_id": "headline",
                                "label": "Headline",
                                "font_family_id": "proof-sans",
                                "font_weight": 700,
                                "font_size_mm": 6.8,
                                "min_font_size_mm": 4.5,
                                "line_height": 1.05,
                                "color": "#1f1a17",
                                "align": "left",
                                "max_length": 60,
                                "max_lines": 3,
                                "required": True,
                                "default_value": "Scanne den QR-Code",
                            }
                        ],
                    }
                ],
                "text_rules": [
                    {
                        "version": 1,
                        "field_id": "headline",
                        "max_lines": 2,
                        "min_font_size_mm": 4.5,
                    }
                ],
                "qr_rules": [
                    {
                        "version": 1,
                        "field_id": "qrTarget",
                        "preset": "rounded-safe",
                        "minimum_width_mm": 18,
                        "minimum_quiet_zone_modules": 4,
                    }
                ],
                "fonts": [{"id": "proof-sans", "family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
                "elements": [],
                "variants": [{"id": "proof", "name": "Proof", "active": True}],
            }
        ),
        encoding="utf-8",
    )

    bundle = load_registry_bundle(registries_dir)

    assert [category.id for category in bundle.categories] == ["case"]
    assert [product.id for product in bundle.products] == ["product"]
    assert [template.id for template in bundle.templates] == ["template"]
    template = bundle.templates[0]
    assert template.reference_asset == "reference/template-reference.svg"
    assert template.safe_areas[0].box_mm.model_dump() == {
        "x_mm": 8.0,
        "y_mm": 8.0,
        "width_mm": 95.0,
        "height_mm": 138.0,
    }
    assert template.text_rules[0].version == 1
    assert template.qr_rules[0].preset == "rounded-safe"
    assert bundle.diagnostics == []


def test_text_variable_font_must_come_from_registry_fonts(tmp_path: Path) -> None:
    registries_dir = tmp_path / "registries"
    (registries_dir / "categories").mkdir(parents=True)
    (registries_dir / "products").mkdir(parents=True)
    (registries_dir / "templates").mkdir(parents=True)

    (registries_dir / "categories" / "case.json").write_text(
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
                "category_ids": ["case"],
                "active": True,
                "page_width_mm": 111,
                "page_height_mm": 154,
                "bleed_mm": 3,
                "fonts": [{"id": "proof-sans", "family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
                "safe_areas": [
                    {
                        "id": "content-safe-area",
                        "box_mm": {
                            "x_mm": 8,
                            "y_mm": 8,
                            "width_mm": 95,
                            "height_mm": 138,
                        },
                        "label": "Content safe area",
                        "variables": [
                            {
                                "id": "headline",
                                "kind": "text",
                                "field_id": "headline",
                                "label": "Headline",
                                "font_family_id": "arial",
                                "font_weight": 700,
                                "font_size_mm": 6.8,
                                "min_font_size_mm": 4.5,
                                "line_height": 1.05,
                                "color": "#1f1a17",
                                "align": "left",
                                "max_length": 60,
                                "max_lines": 3,
                                "required": True,
                                "default_value": "Scanne den QR-Code",
                            }
                        ],
                    }
                ],
                "elements": [],
                "variants": [{"id": "proof", "name": "Proof", "active": True}],
            }
        ),
        encoding="utf-8",
    )

    bundle = load_registry_bundle(registries_dir)

    assert bundle.templates == []
    assert any(issue.code == "registry_schema_invalid" for issue in bundle.diagnostics)
    assert any("unknown font" in str(issue.details) for issue in bundle.diagnostics)


def test_invalid_registry_bundle_is_reported(tmp_path: Path) -> None:
    registries_dir = tmp_path / "registries"
    (registries_dir / "categories").mkdir(parents=True)
    (registries_dir / "products").mkdir(parents=True)
    (registries_dir / "templates").mkdir(parents=True)

    (registries_dir / "categories" / "broken.json").write_text("{\"id\": \"broken\"}", encoding="utf-8")
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
                "category_ids": ["broken"],
                "active": True,
                "page_width_mm": 111,
                "page_height_mm": 154,
                "bleed_mm": 3,
                "fonts": [{"id": "proof-sans", "family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
                "elements": [],
                "variants": [{"id": "proof", "name": "Proof", "active": True}],
            }
        ),
        encoding="utf-8",
    )

    bundle = load_registry_bundle(registries_dir)

    assert bundle.categories == []
    assert bundle.templates == []
    assert any(issue.code == "registry_schema_invalid" for issue in bundle.diagnostics)
    assert any(issue.code == "template_unknown_category" for issue in bundle.diagnostics)


def test_duplicate_template_versions_are_rejected(tmp_path: Path) -> None:
    registries_dir = tmp_path / "registries"
    (registries_dir / "categories").mkdir(parents=True)
    (registries_dir / "products").mkdir(parents=True)
    (registries_dir / "templates").mkdir(parents=True)

    (registries_dir / "categories" / "case.json").write_text(
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
        "category_ids": ["case"],
        "active": True,
        "page_width_mm": 111,
        "page_height_mm": 154,
        "bleed_mm": 3,
        "fonts": [{"id": "proof-sans", "family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
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
    (registries_dir / "categories").mkdir(parents=True)
    (registries_dir / "products").mkdir(parents=True)
    (registries_dir / "templates").mkdir(parents=True)

    (registries_dir / "categories" / "case.json").write_text(
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
                "category_ids": ["case"],
                "active": True,
                "page_width_mm": 111,
                "page_height_mm": 154,
                "bleed_mm": 3,
                "fonts": [{"id": "proof-sans", "family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
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
        assert len(bundle.categories) == 1
        assert len(bundle.products) == 1
        assert len(bundle.templates) == 1
