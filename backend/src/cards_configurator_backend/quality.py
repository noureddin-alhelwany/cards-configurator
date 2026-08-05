from __future__ import annotations

import math
from pathlib import Path

from pydantic import BaseModel

from .drafts.schemas import DraftState
from .registries.loader import RegistryBundle
from .registries.schemas import (
    LayoutState,
    QrElementDefinition,
    RegistryIssue,
    TemplateDefinition,
    TextElementDefinition,
)
from .urls import QR_QUIET_ZONE_MODULES, qr_module_count, resolve_qr_value

# Mirrored in `frontend/src/design/textFit.ts` under the same names so one grep finds both.
AVG_GLYPH_WIDTH_EM = 0.55
DEFAULT_MIN_FIT_SCALE = 0.7
QR_MIN_CONTRAST_RATIO = 3.0


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


def _qr_elements(template: TemplateDefinition) -> list[QrElementDefinition]:
    return [element for element in template.elements if element.kind == "qr"]


def _active_design(template: TemplateDefinition, design_id: str | None):
    if design_id is not None:
        return next((design for design in template.designs if design.active and design.id == design_id), None)
    return next((design for design in template.designs if design.active), None)


def _field_personalizable(template: TemplateDefinition, field_id: str, design_id: str | None) -> bool:
    design = _active_design(template, design_id)
    if design is None:
        return True
    for zone in design.zones:
        for variable in zone.variables or []:
            variable_field_id = variable.field_id or variable.id
            if variable_field_id == field_id:
                return zone.personalizable
    return True


def _hex_to_rgb(color: str) -> tuple[float, float, float] | None:
    value = color.strip().lstrip("#")
    if len(value) == 3:
        try:
            red = int(value[0] * 2, 16)
            green = int(value[1] * 2, 16)
            blue = int(value[2] * 2, 16)
        except ValueError:
            return None
        return red / 255, green / 255, blue / 255
    if len(value) == 6:
        try:
            red = int(value[0:2], 16)
            green = int(value[2:4], 16)
            blue = int(value[4:6], 16)
        except ValueError:
            return None
        return red / 255, green / 255, blue / 255
    return None


def _relative_luminance(color: str) -> float | None:
    rgb = _hex_to_rgb(color)
    if rgb is None:
        return None

    def _channel(value: float) -> float:
        return value / 12.92 if value <= 0.03928 else ((value + 0.055) / 1.055) ** 2.4

    red, green, blue = rgb
    return 0.2126 * _channel(red) + 0.7152 * _channel(green) + 0.0722 * _channel(blue)


def _contrast_ratio(foreground: str, background: str) -> float | None:
    foreground_luminance = _relative_luminance(foreground)
    background_luminance = _relative_luminance(background)
    if foreground_luminance is None or background_luminance is None:
        return None
    lighter = max(foreground_luminance, background_luminance)
    darker = min(foreground_luminance, background_luminance)
    return (lighter + 0.05) / (darker + 0.05)


def _min_fit_scale(element: TextElementDefinition) -> float:
    """Shrink floor as a scale factor.

    A purely relative floor is meaningless across font sizes: 70% of 6.8mm is a readable
    4.8mm, while 70% of 3.1mm is 2.2mm. A template may therefore state an absolute floor.
    """
    if element.min_font_size_mm is not None and element.font_size_mm > 0:
        return min(1.0, max(0.0, element.min_font_size_mm / element.font_size_mm))
    return DEFAULT_MIN_FIT_SCALE


def _measure_text_fit(
    element: TextElementDefinition,
    text: str,
    max_lines: int | None,
    letter_spacing_em: float,
) -> tuple[float, float, int]:
    paragraphs = text.strip().split("\n")
    glyph_width_em = max(0.1, AVG_GLYPH_WIDTH_EM + letter_spacing_em)
    font_size_mm = max(0.001, element.font_size_mm)
    chars_per_line = max(1, math.floor(element.box_mm.width_mm / (font_size_mm * glyph_width_em)))
    longest_line = max((len(paragraph) for paragraph in paragraphs), default=1)
    estimated_lines = sum(max(1, math.ceil(max(len(paragraph), 1) / chars_per_line)) for paragraph in paragraphs)
    width_scale = min(1.0, element.box_mm.width_mm / max(longest_line * font_size_mm * glyph_width_em, 0.1))
    height_scale = min(
        1.0, element.box_mm.height_mm / max(estimated_lines * font_size_mm * element.line_height, 0.1)
    )
    line_scale = min(1.0, max_lines / estimated_lines) if max_lines else 1.0
    return min(width_scale, height_scale, line_scale), width_scale, estimated_lines


def _estimate_text_scale(
    element: TextElementDefinition, text: str, max_lines: int | None
) -> tuple[float, float, int, float | None]:
    """Mirror of `frontend/src/design/textFit.ts` — see the contract note there.

    The constants and the operation order are kept identical on both sides, and
    `backend/tests/test_text_fit.py` plus `textFit.test.ts` assert equal results from the
    same fixture. Diverging here means the preview and the quality gate disagree about
    whether a card is printable.
    """
    original_spacing = element.letter_spacing_em
    base_spacing = max(0.0, original_spacing or 0.0)
    raw_scale, _, estimated_lines = _measure_text_fit(element, text, max_lines, base_spacing)
    effective_spacing = original_spacing

    if base_spacing > 0.0 and raw_scale < 1.0:
        zero_spacing_raw_scale, _, zero_spacing_estimated_lines = _measure_text_fit(element, text, max_lines, 0.0)
        if zero_spacing_raw_scale >= 1.0:
            lower_bound = 0.0
            upper_bound = base_spacing
            best_spacing = 0.0
            for _ in range(24):
                midpoint = (lower_bound + upper_bound) / 2
                probe_raw_scale, _, probe_estimated_lines = _measure_text_fit(element, text, max_lines, midpoint)
                if probe_raw_scale >= 1.0:
                    best_spacing = midpoint
                    lower_bound = midpoint
                    raw_scale, _, estimated_lines = probe_raw_scale, _, probe_estimated_lines
                else:
                    upper_bound = midpoint
            effective_spacing = best_spacing
            raw_scale, _, estimated_lines = _measure_text_fit(element, text, max_lines, best_spacing)
        else:
            effective_spacing = 0.0
            raw_scale = zero_spacing_raw_scale
            estimated_lines = zero_spacing_estimated_lines

    min_scale = _min_fit_scale(element)
    return max(min_scale, raw_scale), raw_scale, estimated_lines, effective_spacing


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

        too_long = (
            field.type in {"text", "url"}
            and bool(value)
            and field.max_length is not None
            and len(value) > field.max_length
        )
        if too_long and field.max_length is not None:
            issues.append(
                _issue(
                    "text_too_long",
                    field.id,
                    f"Text in field '{field.id}' exceeds the allowed length",
                    blocking=len(value) > field.max_length * 2,
                    details={"max_length": field.max_length, "length": len(value)},
                )
            )

    # Text fitting iterates ELEMENTS, not fields, so the inputs are byte-identical to what
    # `renderTextElement` fits. Iterating fields skipped every text element without a
    # matching field -- including the shipped static `body` element, which the preview does
    # shrink but nothing validated -- and it took `max_lines` from the field being iterated
    # rather than the one bound to the element.
    for element in template.elements:
        if element.kind != "text":
            continue
        bound_field = next((candidate for candidate in template.fields if candidate.id == element.id), None)
        raw_text = layout_state.text_values.get(element.id)
        text = (raw_text if raw_text is not None else element.text).strip()
        if not text:
            continue

        max_lines = bound_field.max_lines if bound_field else None
        scale, raw_scale, estimated_lines, effective_letter_spacing_em = _estimate_text_scale(element, text, max_lines)
        min_scale = _min_fit_scale(element)
        if raw_scale >= 1.0:
            continue

        editable = bound_field is not None and _field_personalizable(template, bound_field.id, layout_state.design_id)

        # Static copy has no field, so the customer cannot fix it. Report it to the template
        # author as a warning rather than blocking an order they cannot influence.
        issues.append(
            _issue(
                "text_overflow",
                element.id if bound_field is None else bound_field.id,
                (
                    f"Text in field '{bound_field.id}' needs layout adjustment"
                    if bound_field is not None
                    else f"Static text in element '{element.id}' does not fit its box"
                ),
                blocking=editable and raw_scale < min_scale,
                details={
                    "fit_scale": scale,
                    "raw_fit_scale": round(raw_scale, 3),
                    "min_fit_scale": round(min_scale, 3),
                    "estimated_lines": estimated_lines,
                    "max_lines": max_lines,
                    "max_length": bound_field.max_length if bound_field else None,
                    "editable": editable,
                    "effective_letter_spacing_em": effective_letter_spacing_em,
                },
            )
        )

    qr_value = resolve_qr_value(template, layout_state)
    for qr_element in _qr_elements(template):
        if not qr_value:
            continue
        module_count = qr_module_count(qr_value)
        symbol_width_mm = min(qr_element.box_mm.width_mm, qr_element.box_mm.height_mm)
        module_pitch_mm = symbol_width_mm / module_count if module_count else 0.0
        required_quiet_zone_mm = QR_QUIET_ZONE_MODULES * module_pitch_mm
        shared_details: dict[str, object] = {
            "effective_width_mm": round(symbol_width_mm, 2),
            "effective_module_mm": round(module_pitch_mm, 3),
            "quiet_zone_mm": qr_element.quiet_zone_mm,
            "required_quiet_zone_mm": round(required_quiet_zone_mm, 2),
            "module_count": module_count,
            "encoded_length": len(qr_value),
        }

        if qr_element.quiet_zone_mm < required_quiet_zone_mm:
            issues.append(
                _issue(
                    "qr_quiet_zone_too_small",
                    qr_element.id,
                    f"QR code '{qr_element.id}' needs a quiet zone of at least "
                    f"{required_quiet_zone_mm:.2f}mm ({QR_QUIET_ZONE_MODULES} modules)",
                    blocking=False,
                    details={**shared_details, "editable": False},
                )
            )

        contrast_ratio = _contrast_ratio(qr_element.color, qr_element.background)
        if contrast_ratio is not None and contrast_ratio < QR_MIN_CONTRAST_RATIO:
            issues.append(
                _issue(
                    "qr_contrast_too_low",
                    qr_element.id,
                    f"QR code '{qr_element.id}' has insufficient contrast",
                    details={
                        **shared_details,
                        "color": qr_element.color,
                        "background": qr_element.background,
                        "contrast_ratio": round(contrast_ratio, 2),
                        "minimum_contrast_ratio": QR_MIN_CONTRAST_RATIO,
                    },
                )
            )

    return QualityReport(issues=issues, blocking=any(issue.blocking for issue in issues))
