from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

from .artwork_geometry import geometry_compatible, probe_artwork_geometry
from .schemas import BoxMm


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _parse_mm(value: str) -> float:
    return float(value.strip().removesuffix("mm"))


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


def _coerce_template_design(payload: dict[str, Any], design_id: str, design_name: str | None) -> dict[str, Any]:
    designs = payload.setdefault("designs", payload.get("variants", []))
    if not isinstance(designs, list):
        raise TypeError("template JSON field 'designs' must be a list")

    for existing_design in designs:
        if isinstance(existing_design, dict) and existing_design.get("id") == design_id:
            if design_name is not None:
                existing_design["name"] = design_name
            return existing_design

    new_design: dict[str, Any] = {"id": design_id, "name": design_name or design_id, "active": True}
    designs.append(new_design)
    return new_design


def update_template_from_svg(
    template_path: Path,
    svg_path: Path,
    output_path: Path,
    *,
    slot_prefix: str = "slot-",
    reference_path: Path | None = None,
    reference_asset: str | None = None,
    source_asset: str | None = None,
    background_asset: str | None = None,
    variant_id: str | None = None,
    variant_name: str | None = None,
    preview_asset: str | None = None,
    accent_color: str | None = None,
) -> None:
    payload = json.loads(template_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise TypeError("template JSON must contain an object")

    background_geometry = probe_artwork_geometry(svg_path)
    if background_geometry is None:
        raise ValueError(f"background artwork '{svg_path}' could not be read")

    if reference_path is not None:
        reference_geometry = probe_artwork_geometry(reference_path)
        if reference_geometry is None:
            raise ValueError(f"reference artwork '{reference_path}' could not be read")
        if not geometry_compatible(reference_geometry, background_geometry):
            raise ValueError(
                "reference and background artwork must share the same dimensions and orientation"
            )

    slot_boxes = extract_slot_boxes(svg_path, slot_prefix=slot_prefix)
    elements = payload.get("elements", [])
    if not isinstance(elements, list):
        raise TypeError("template JSON field 'elements' must be a list")

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

    asset_value = source_asset if source_asset is not None else background_asset

    if reference_asset is not None:
        payload["reference_asset"] = reference_asset
    if asset_value is not None:
        payload["source_asset"] = asset_value
        payload["background_asset"] = asset_value

    if variant_id is not None:
        design = _coerce_template_design(payload, variant_id, variant_name)
        if preview_asset is not None:
            design["preview_asset"] = preview_asset
        if asset_value is not None:
            design["source_asset"] = asset_value
            design["background_asset"] = asset_value
        if accent_color is not None:
            design["accent_color"] = accent_color

    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Import template slot geometry from an SVG artboard")
    parser.add_argument("--template", required=True, type=Path, help="Template JSON to update")
    parser.add_argument("--svg", required=True, type=Path, help="SVG artboard with named slot placeholders")
    parser.add_argument("--output", required=True, type=Path, help="Path for the updated template JSON")
    parser.add_argument("--slot-prefix", default="slot-", help="Prefix used for placeholder ids")
    parser.add_argument("--reference-path", type=Path, help="Reference artwork file to validate against the background")
    parser.add_argument("--reference-asset", help="Reference asset to write into the template")
    parser.add_argument("--source-asset", help="Source asset to write into the template")
    parser.add_argument("--background-asset", help="Background asset to write into the template")
    parser.add_argument("--variant-id", help="Variant id to create or update")
    parser.add_argument("--variant-name", help="Variant name to create or update")
    parser.add_argument("--preview-asset", help="Preview asset to write into the variant")
    parser.add_argument("--accent-color", help="Variant accent colour")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_argument_parser()
    args = parser.parse_args(argv)
    update_template_from_svg(
        args.template,
        args.svg,
        args.output,
        slot_prefix=args.slot_prefix,
        reference_path=args.reference_path,
        reference_asset=args.reference_asset,
        source_asset=args.source_asset,
        background_asset=args.background_asset,
        variant_id=args.variant_id,
        variant_name=args.variant_name,
        preview_asset=args.preview_asset,
        accent_color=args.accent_color,
    )
    return 0
