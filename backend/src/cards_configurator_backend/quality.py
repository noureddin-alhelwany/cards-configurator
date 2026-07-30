from __future__ import annotations

import math
from pathlib import Path

import segno
from fastapi import HTTPException
from pydantic import BaseModel

from .assets import load_asset
from .drafts.schemas import DraftState
from .registries.loader import RegistryBundle
from .registries.schemas import (
    ElementAdjustment,
    ImageElementDefinition,
    LayoutState,
    QrElementDefinition,
    RegistryIssue,
    TemplateDefinition,
    TextElementDefinition,
)


class QualityReport(BaseModel):
    issues: list[RegistryIssue]
    blocking: bool


def _issue(
    code: str,
    path: str,
    message: str,
    *,
    blocking: bool = True,
    details: dict[str, object] | None = None,
) -> RegistryIssue:
    return RegistryIssue(
        code=code,
        severity="error" if blocking else "warning",
        path=path,
        message=message,
        blocking=blocking,
        details=details or {},
    )


def _find_template(bundle: RegistryBundle, draft: DraftState) -> TemplateDefinition | None:
    if draft.template_id is None or draft.template_version is None:
        return None
    return next(
        (
            template
            for template in bundle.templates
            if template.active and template.id == draft.template_id and template.version == draft.template_version
        ),
        None,
    )


def _text_element_by_id(template: TemplateDefinition, element_id: str) -> TextElementDefinition | None:
    for element in template.elements:
        if element.kind == "text" and element.id == element_id:
            return element
    return None


def _image_element_by_asset_key(template: TemplateDefinition, asset_key: str) -> ImageElementDefinition | None:
    for element in template.elements:
        if element.kind == "image" and element.asset_key == asset_key:
            return element
    return None


def _qr_elements(template: TemplateDefinition) -> list[QrElementDefinition]:
    return [element for element in template.elements if element.kind == "qr"]


def _estimate_text_scale(element: TextElementDefinition, text: str, max_lines: int | None) -> tuple[float, float, int]:
    paragraphs = text.split("\n")
    chars_per_line = max(1, math.floor(element.box_mm.width_mm / (element.font_size_mm * 0.55)))
    longest_line = max((len(paragraph) for paragraph in paragraphs), default=1)
    estimated_lines = sum(max(1, math.ceil(max(len(paragraph), 1) / chars_per_line)) for paragraph in paragraphs)
    width_scale = min(1.0, element.box_mm.width_mm / max(longest_line * element.font_size_mm * 0.55, 0.1))
    height_scale = min(1.0, element.box_mm.height_mm / max(estimated_lines * element.font_size_mm * element.line_height, 0.1))
    line_scale = min(1.0, max_lines / estimated_lines) if max_lines else 1.0
    raw_scale = min(width_scale, height_scale, line_scale)
    return max(0.7, raw_scale), raw_scale, estimated_lines


def validate_current_draft(data_dir: Path, bundle: RegistryBundle, draft: DraftState) -> QualityReport:
    template = _find_template(bundle, draft)
    if template is None:
        return QualityReport(issues=[], blocking=False)

    issues: list[RegistryIssue] = []
    layout_state: LayoutState = draft.layout_state

    for field in template.fields:
        raw_value = layout_state.text_values.get(field.id, "")
        asset_id = layout_state.asset_values.get(field.id, "")
        value = raw_value.strip()

        if field.required:
            if field.type in {"text", "url"} and not value:
                issues.append(_issue("required_field_missing", field.id, f"Required field '{field.id}' is missing"))
                continue
            if field.type in {"logo", "image"} and not asset_id:
                issues.append(_issue("required_field_missing", field.id, f"Required field '{field.id}' is missing"))
                continue

        if field.type in {"text", "url"} and value:
            element = _text_element_by_id(template, field.id)
            if element is None:
                continue
            scale, raw_scale, estimated_lines = _estimate_text_scale(element, value, field.max_lines)
            if raw_scale < 1.0:
                blocking = raw_scale < 0.7
                issues.append(
                    _issue(
                        "text_overflow",
                        field.id,
                        f"Text in field '{field.id}' needs layout adjustment",
                        blocking=blocking,
                        details={
                            "fit_scale": scale,
                            "raw_fit_scale": round(raw_scale, 3),
                            "estimated_lines": estimated_lines,
                            "max_lines": field.max_lines,
                            "max_length": field.max_length,
                        },
                    )
                )
            if field.max_length is not None and len(value) > field.max_length:
                issues.append(
                    _issue(
                        "text_too_long",
                        field.id,
                        f"Text in field '{field.id}' exceeds the allowed length",
                        blocking=len(value) > field.max_length * 2,
                        details={"max_length": field.max_length, "length": len(value)},
                    )
                )

    product = next((record for record in bundle.products if record.id == template.product_id), None)
    if product is not None:
        for qr_element in _qr_elements(template):
            qr = segno.make(qr_element.value, error="m")
            module_count = qr.symbol_size(border=0)[0]
            visible_width_mm = min(qr_element.box_mm.width_mm, qr_element.box_mm.height_mm)
            module_pitch_mm = max((visible_width_mm - 2 * qr_element.quiet_zone_mm) / module_count, 0.0)
            if visible_width_mm < product.qr_min_width_mm or module_pitch_mm < product.qr_min_module_mm:
                issues.append(
                    _issue(
                        "qr_too_small",
                        qr_element.id,
                        f"QR code '{qr_element.id}' is below the minimum size",
                        details={
                            "effective_width_mm": round(visible_width_mm, 2),
                            "effective_module_mm": round(module_pitch_mm, 3),
                            "minimum_width_mm": product.qr_min_width_mm,
                            "minimum_module_mm": product.qr_min_module_mm,
                            "quiet_zone_mm": qr_element.quiet_zone_mm,
                            "module_count": module_count,
                        },
                    )
                )

        for field in template.fields:
            asset_id = layout_state.asset_values.get(field.id, "")
            if field.type not in {"logo", "image"} or not asset_id:
                continue
            image_element = _image_element_by_asset_key(template, field.id)
            if image_element is None:
                continue
            try:
                asset = load_asset(data_dir, asset_id)
            except HTTPException:
                continue
            width_px = asset.get("width_px")
            if not isinstance(width_px, (int, float)) or width_px <= 0:
                continue
            adjustment: ElementAdjustment = layout_state.element_adjustments.get(image_element.id, ElementAdjustment())
            visible_width_mm = max(image_element.box_mm.width_mm * adjustment.scale, 0.1)
            effective_dpi = float(width_px) / (visible_width_mm / 25.4)
            if effective_dpi < product.minimum_dpi:
                issues.append(
                    _issue(
                        "image_dpi_too_low",
                        field.id,
                        f"Image in field '{field.id}' is below the minimum DPI",
                        details={
                            "effective_dpi": round(effective_dpi, 2),
                            "minimum_dpi": product.minimum_dpi,
                            "warning_dpi": product.warning_dpi,
                            "recommended_dpi": product.recommended_dpi,
                        },
                    )
                )
            elif effective_dpi < product.warning_dpi:
                issues.append(
                    _issue(
                        "image_dpi_warning",
                        field.id,
                        f"Image in field '{field.id}' is below the recommended DPI",
                        blocking=False,
                        details={
                            "effective_dpi": round(effective_dpi, 2),
                            "minimum_dpi": product.minimum_dpi,
                            "warning_dpi": product.warning_dpi,
                            "recommended_dpi": product.recommended_dpi,
                        },
                    )
                )

    return QualityReport(issues=issues, blocking=any(issue.blocking for issue in issues))
