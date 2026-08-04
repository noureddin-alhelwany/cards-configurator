from __future__ import annotations

import json
from pathlib import Path

from cards_configurator_backend.registries.svg_import import (
    extract_slot_boxes,
    update_template_from_svg,
)


def test_extract_slot_boxes_reads_named_placeholders(tmp_path: Path) -> None:
    svg_path = tmp_path / "template.svg"
    svg_path.write_text(
        """
        <svg xmlns="http://www.w3.org/2000/svg" width="111mm" height="154mm" viewBox="0 0 111 154">
          <rect id="slot-headline" x="10" y="12" width="40mm" height="8mm" />
          <rect id="slot-logo" x="18" y="44" width="20" height="20" />
        </svg>
        """.strip(),
        encoding="utf-8",
    )

    slots = extract_slot_boxes(svg_path)

    assert slots["headline"].model_dump() == {
        "x_mm": 10.0,
        "y_mm": 12.0,
        "width_mm": 40.0,
        "height_mm": 8.0,
    }
    assert slots["logo"].model_dump() == {
        "x_mm": 18.0,
        "y_mm": 44.0,
        "width_mm": 20.0,
        "height_mm": 20.0,
    }


def test_update_template_from_svg_writes_slot_boxes_and_variant_design(tmp_path: Path) -> None:
    template_path = tmp_path / "template.json"
    svg_path = tmp_path / "template.svg"
    output_path = tmp_path / "updated.json"

    template_path.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "id": "proof_a6_card",
                "version": "1.6.0",
                "product_id": "a6_card",
                "page_width_mm": 111,
                "page_height_mm": 154,
                "bleed_mm": 3,
                "fonts": [{"id": "proof-sans", "family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
                "elements": [
                    {
                        "kind": "text",
                        "id": "headline",
                        "box_mm": {"x_mm": 0, "y_mm": 0, "width_mm": 1, "height_mm": 1},
                        "z_index": 1,
                        "text": "Headline",
                        "font_family_id": "proof-sans",
                        "font_size_mm": 5,
                        "font_weight": 700,
                        "color": "#000000",
                        "line_height": 1.0,
                        "align": "left",
                        "valign": "top",
                        "min_font_size_mm": None,
                    }
                ],
                "variants": [],
            }
        ),
        encoding="utf-8",
    )
    svg_path.write_text(
        """
        <svg xmlns="http://www.w3.org/2000/svg" width="111mm" height="154mm" viewBox="0 0 111 154">
          <rect id="slot-headline" x="12" y="14" width="48" height="10" />
        </svg>
        """.strip(),
        encoding="utf-8",
    )

    update_template_from_svg(
        template_path,
        svg_path,
        output_path,
        background_asset="backgrounds/proof_a6_card-1.6.0-classic.svg",
        variant_id="classic",
        variant_name="Classic",
        preview_asset="template_google_reviews_classic.png",
        accent_color="#315a86",
    )

    updated = json.loads(output_path.read_text(encoding="utf-8"))
    assert updated["background_asset"] == "backgrounds/proof_a6_card-1.6.0-classic.svg"
    assert updated["elements"][0]["box_mm"] == {
        "x_mm": 12.0,
        "y_mm": 14.0,
        "width_mm": 48.0,
        "height_mm": 10.0,
    }
    assert updated["variants"][0] == {
        "id": "classic",
        "name": "Classic",
        "active": True,
        "preview_asset": "template_google_reviews_classic.png",
        "source_asset": "backgrounds/proof_a6_card-1.6.0-classic.svg",
        "background_asset": "backgrounds/proof_a6_card-1.6.0-classic.svg",
        "accent_color": "#315a86",
    }


def test_update_template_from_svg_writes_reference_artwork_and_checks_geometry(tmp_path: Path) -> None:
    template_path = tmp_path / "template.json"
    background_svg = tmp_path / "background.svg"
    reference_svg = tmp_path / "reference.svg"
    output_path = tmp_path / "updated.json"

    template_path.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "id": "proof_a6_card",
                "version": "1.6.0",
                "product_id": "a6_card",
                "page_width_mm": 111,
                "page_height_mm": 154,
                "bleed_mm": 3,
                "fonts": [{"id": "proof-sans", "family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
                "elements": [],
                "variants": [],
            }
        ),
        encoding="utf-8",
    )
    background_svg.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" width="111mm" height="154mm" viewBox="0 0 111 154"></svg>',
        encoding="utf-8",
    )
    reference_svg.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" width="111mm" height="154mm" viewBox="0 0 111 154"></svg>',
        encoding="utf-8",
    )

    update_template_from_svg(
        template_path,
        background_svg,
        output_path,
        reference_path=reference_svg,
        reference_asset="reference/proof_a6_card-reference.svg",
        background_asset="backgrounds/proof_a6_card-background.svg",
    )

    updated = json.loads(output_path.read_text(encoding="utf-8"))
    assert updated["reference_asset"] == "reference/proof_a6_card-reference.svg"
    assert updated["source_asset"] == "backgrounds/proof_a6_card-background.svg"
    assert updated["background_asset"] == "backgrounds/proof_a6_card-background.svg"


def test_update_template_from_svg_rejects_mismatched_reference_geometry(tmp_path: Path) -> None:
    template_path = tmp_path / "template.json"
    background_svg = tmp_path / "background.svg"
    reference_svg = tmp_path / "reference.svg"
    output_path = tmp_path / "updated.json"

    template_path.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "id": "proof_a6_card",
                "version": "1.6.0",
                "product_id": "a6_card",
                "page_width_mm": 111,
                "page_height_mm": 154,
                "bleed_mm": 3,
                "fonts": [{"id": "proof-sans", "family": "Proof Sans", "file": "/fonts/ProofSans.ttf"}],
                "elements": [],
                "variants": [],
            }
        ),
        encoding="utf-8",
    )
    background_svg.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" width="111mm" height="154mm" viewBox="0 0 111 154"></svg>',
        encoding="utf-8",
    )
    reference_svg.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" width="154mm" height="111mm" viewBox="0 0 154 111"></svg>',
        encoding="utf-8",
    )

    try:
        update_template_from_svg(
            template_path,
            background_svg,
            output_path,
            reference_path=reference_svg,
            reference_asset="reference/proof_a6_card-reference.svg",
            background_asset="backgrounds/proof_a6_card-background.svg",
        )
    except ValueError as exc:
        assert "same dimensions and orientation" in str(exc)
    else:
        raise AssertionError("mismatched reference artwork should be rejected")
