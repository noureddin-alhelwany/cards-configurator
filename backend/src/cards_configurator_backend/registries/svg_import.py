from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

from .schemas import BoxMm


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _parse_mm(value: str) -> float:
    stripped = value.strip()
    if stripped.endswith("mm"):
        stripped = stripped[:-2]
    return float(stripped)


def _parse_box(element: ET.Element) -> BoxMm:
    try:
        return BoxMm(
            x_mm=_parse_mm(element.attrib["x"]),
            y_mm=_parse_mm(element.attrib["y"]),
            width_mm=_parse_mm(element.attrib["width"]),
            height_mm=_parse_mm(element.attrib["height"]),
        )
    except KeyError as exception:
        missing = exception.args[0]
        raise ValueError(f"slot '{element.attrib.get('id', '<unnamed>')}' is missing required attribute '{missing}'") from exception


def extract_slot_boxes(svg_path: Path, *, slot_prefix: str = "slot-") -> dict[str, BoxMm]:
    """Read named slot placeholders from an SVG artboard.

    The importer expects simple `<rect>` placeholders with ids like `slot-headline`.
    Geometry is authored once in the SVG and then written into template JSON, so the
    layout boxes cannot drift away from the source artwork.
    """
    root = ET.parse(svg_path).getroot()
    slots: dict[str, BoxMm] = {}
    for element in root.iter():
        element_id = element.attrib.get("id")
        if not element_id or not element_id.startswith(slot_prefix):
            continue
        if _local_name(element.tag) != "rect":
            raise ValueError(f"slot placeholder '{element_id}' must be a <rect>")
        slot_id = element_id.removeprefix(slot_prefix)
        if not slot_id:
            raise ValueError(f"slot placeholder '{element_id}' needs a name after '{slot_prefix}'")
        slots[slot_id] = _parse_box(element)
    return slots


def _coerce_template_variant(payload: dict[str, Any], variant_id: str, variant_name: str | None) -> dict[str, Any]:
    variants = payload.setdefault("variants", [])
    if not isinstance(variants, list):
        raise ValueError("template JSON field 'variants' must be a list")

    for variant in variants:
        if isinstance(variant, dict) and variant.get("id") == variant_id:
            if variant_name is not None:
                variant["name"] = variant_name
            return variant

    variant: dict[str, Any] = {"id": variant_id, "name": variant_name or variant_id, "active": True}
    variants.append(variant)
    return variant


def update_template_from_svg(
    template_path: Path,
    svg_path: Path,
    output_path: Path,
    *,
    slot_prefix: str = "slot-",
    background_asset: str | None = None,
    variant_id: str | None = None,
    variant_name: str | None = None,
    preview_asset: str | None = None,
    accent_color: str | None = None,
    headline_font_family: str | None = None,
    headline_font_weight: int | None = None,
) -> None:
    payload = json.loads(template_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("template JSON must contain an object")

    slot_boxes = extract_slot_boxes(svg_path, slot_prefix=slot_prefix)
    elements = payload.get("elements", [])
    if not isinstance(elements, list):
        raise ValueError("template JSON field 'elements' must be a list")

    for element in elements:
        if not isinstance(element, dict):
            continue
        element_id = element.get("id")
        if not isinstance(element_id, str):
            continue
        box = slot_boxes.get(element_id) or slot_boxes.get(f"{slot_prefix}{element_id}")
        if box is None:
            continue
        element["box_mm"] = box.model_dump()

    if background_asset is not None:
        payload["background_asset"] = background_asset

    if variant_id is not None:
        variant = _coerce_template_variant(payload, variant_id, variant_name)
        if preview_asset is not None:
            variant["preview_asset"] = preview_asset
        if background_asset is not None:
            variant["background_asset"] = background_asset
        if accent_color is not None:
            variant["accent_color"] = accent_color
        if headline_font_family is not None:
            variant["headline_font_family"] = headline_font_family
        if headline_font_weight is not None:
            variant["headline_font_weight"] = headline_font_weight

    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Import template slot geometry from an SVG artboard")
    parser.add_argument("--template", required=True, type=Path, help="Template JSON to update")
    parser.add_argument("--svg", required=True, type=Path, help="SVG artboard with named slot placeholders")
    parser.add_argument("--output", required=True, type=Path, help="Path for the updated template JSON")
    parser.add_argument("--slot-prefix", default="slot-", help="Prefix used for placeholder ids")
    parser.add_argument("--background-asset", help="Background asset to write into the template")
    parser.add_argument("--variant-id", help="Variant id to create or update")
    parser.add_argument("--variant-name", help="Variant name to create or update")
    parser.add_argument("--preview-asset", help="Preview asset to write into the variant")
    parser.add_argument("--accent-color", help="Variant accent colour")
    parser.add_argument("--headline-font-family", help="Variant headline font family")
    parser.add_argument("--headline-font-weight", type=int, help="Variant headline font weight")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_argument_parser()
    args = parser.parse_args(argv)
    update_template_from_svg(
        args.template,
        args.svg,
        args.output,
        slot_prefix=args.slot_prefix,
        background_asset=args.background_asset,
        variant_id=args.variant_id,
        variant_name=args.variant_name,
        preview_asset=args.preview_asset,
        accent_color=args.accent_color,
        headline_font_family=args.headline_font_family,
        headline_font_weight=args.headline_font_weight,
    )
    return 0
