from __future__ import annotations

import math
from pathlib import Path

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


def _image_element_by_asset_key(template: TemplateDefinition, asset_key: str) -> ImageElementDefinition | None:
    for element in template.elements:
        if element.kind == "image" and element.asset_key == asset_key:
            return element
    return None


def _qr_elements(template: TemplateDefinition) -> list[QrElementDefinition]:
    return [element for element in template.elements if element.kind == "qr"]


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


def effective_image_scale(element: ImageElementDefinition, adjustment: ElementAdjustment) -> float:
    """The zoom the renderer will actually apply.

    `DesignRenderer` clamps to the element's declared range before drawing, while this gate
    used the raw stored value. Nothing clamps on write either (`update_layout_state` merges
    blindly), so a crafted PATCH of `scale: 3.0` against `max_scale: 1.2` made the gate
    compute a DPI 2.5x too low and refuse a perfectly good upload.
    """
    return min(element.max_scale, max(element.min_scale, adjustment.scale))


def effective_image_dpi(
    element: ImageElementDefinition,
    adjustment: ElementAdjustment,
    width_px: float,
    height_px: float | None,
) -> tuple[float, dict[str, object]]:
    """Printed resolution of an uploaded image, accounting for the visible crop.

    `QUALITY_STRATEGY.md` requires source pixels, visible crop, zoom and printed size to be
    considered. The old formula used the width axis alone, which is merely conservative for
    `contain` but **over-reports for `cover`**: a 1000x300 photo in a 60x40mm cover box really
    prints at min(423, 190) = 190 dpi, below the 225 minimum, yet the width axis alone
    reported 423 and let it through -- the card then prints visibly soft.

    - `contain` fits the limiting axis, so every pixel stays visible and the denser axis wins.
    - `cover` fills the box and crops the overflow, so the sparser axis decides.
    """
    scale = effective_image_scale(element, adjustment)
    visible_width_mm = max(element.box_mm.width_mm * scale, 0.1)
    visible_height_mm = max(element.box_mm.height_mm * scale, 0.1)

    dpi_x = float(width_px) / (visible_width_mm / 25.4)
    details: dict[str, object] = {
        "fit": element.fit,
        "applied_scale": round(scale, 3),
        "requested_scale": round(adjustment.scale, 3),
        "dpi_x": round(dpi_x, 2),
    }

    if height_px is None or height_px <= 0:
        # Vector uploads report no pixel height; the width axis is all we have.
        details["dpi_y"] = None
        return dpi_x, details

    dpi_y = float(height_px) / (visible_height_mm / 25.4)
    details["dpi_y"] = round(dpi_y, 2)
    dpi = max(dpi_x, dpi_y) if element.fit == "contain" else min(dpi_x, dpi_y)
    return dpi, details


def _min_fit_scale(element: TextElementDefinition) -> float:
    """Shrink floor as a scale factor.

    A purely relative floor is meaningless across font sizes: 70% of 6.8mm is a readable
    4.8mm, while 70% of 3.1mm is 2.2mm. A template may therefore state an absolute floor.
    """
    if element.min_font_size_mm is not None and element.font_size_mm > 0:
        return min(1.0, max(0.0, element.min_font_size_mm / element.font_size_mm))
    return DEFAULT_MIN_FIT_SCALE


def _estimate_text_scale(element: TextElementDefinition, text: str, max_lines: int | None) -> tuple[float, float, int]:
    """Mirror of `frontend/src/design/textFit.ts` — see the contract note there.

    The constants and the operation order are kept identical on both sides, and
    `backend/tests/test_text_fit.py` plus `textFit.test.ts` assert equal results from the
    same fixture. Diverging here means the preview and the quality gate disagree about
    whether a card is printable.
    """
    paragraphs = text.strip().split("\n")
    chars_per_line = max(1, math.floor(element.box_mm.width_mm / (element.font_size_mm * AVG_GLYPH_WIDTH_EM)))
    longest_line = max((len(paragraph) for paragraph in paragraphs), default=1)
    estimated_lines = sum(max(1, math.ceil(max(len(paragraph), 1) / chars_per_line)) for paragraph in paragraphs)
    width_scale = min(1.0, element.box_mm.width_mm / max(longest_line * element.font_size_mm * AVG_GLYPH_WIDTH_EM, 0.1))
    height_scale = min(
        1.0, element.box_mm.height_mm / max(estimated_lines * element.font_size_mm * element.line_height, 0.1)
    )
    line_scale = min(1.0, max_lines / estimated_lines) if max_lines else 1.0
    raw_scale = min(width_scale, height_scale, line_scale)
    min_scale = _min_fit_scale(element)
    return max(min_scale, raw_scale), raw_scale, estimated_lines


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
        scale, raw_scale, estimated_lines = _estimate_text_scale(element, text, max_lines)
        min_scale = _min_fit_scale(element)
        if raw_scale >= 1.0:
            continue

        # Static copy has no field, so the customer cannot fix it. Report it to the template
        # author as a warning rather than blocking an order they cannot influence.
        editable = bound_field is not None
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
                },
            )
        )

    product = next((record for record in bundle.products if record.id == template.product_id), None)
    if product is not None:
        # Validate the QR the customer will actually get, not the template's static value.
        # A longer URL needs a higher QR version, which means more modules in the same box
        # and therefore a finer module pitch -- exactly what the product minimum guards.
        qr_value = resolve_qr_value(template, layout_state)
        for qr_element in _qr_elements(template):
            if not qr_value:
                continue
            module_count = qr_module_count(qr_value)
            # The element box IS the symbol (segno renders with `border=0`), so the pitch is
            # a plain division. The quiet zone is a separate plate drawn around the box.
            symbol_width_mm = min(qr_element.box_mm.width_mm, qr_element.box_mm.height_mm)
            module_pitch_mm = symbol_width_mm / module_count if module_count else 0.0
            required_quiet_zone_mm = QR_QUIET_ZONE_MODULES * module_pitch_mm
            shared_details: dict[str, object] = {
                "effective_width_mm": round(symbol_width_mm, 2),
                "effective_module_mm": round(module_pitch_mm, 3),
                "minimum_width_mm": product.qr_min_width_mm,
                "minimum_module_mm": product.qr_min_module_mm,
                "quiet_zone_mm": qr_element.quiet_zone_mm,
                "required_quiet_zone_mm": round(required_quiet_zone_mm, 2),
                "module_count": module_count,
                "encoded_length": len(qr_value),
            }

            if symbol_width_mm < product.qr_min_width_mm or module_pitch_mm < product.qr_min_module_mm:
                issues.append(
                    _issue(
                        "qr_too_small",
                        qr_element.id,
                        f"QR code '{qr_element.id}' is below the minimum size",
                        details=shared_details,
                    )
                )

            # A quiet zone narrower than four modules is outside ISO/IEC 18004 and scanners
            # start failing on it.
            #
            # Deliberately NOT blocking, and the reason is counter-intuitive: the requirement
            # is four *modules*, so a SHORTER url needs a WIDER zone (fewer, larger modules).
            # A fixed millimetre value in the template therefore cannot cover every input, and
            # blocking would mean a customer shortening their link gets their order refused
            # over a template value they cannot reach. `qr_too_small` remains blocking because
            # the customer can act on that one by shortening the URL.
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

            # The plate extends beyond the element box, so it can reach past the trim line.
            plate = qr_element.quiet_zone_mm
            inside_trim = (
                qr_element.box_mm.x_mm - plate >= template.bleed_mm
                and qr_element.box_mm.y_mm - plate >= template.bleed_mm
                and qr_element.box_mm.x_mm + qr_element.box_mm.width_mm + plate
                <= template.page_width_mm - template.bleed_mm
                and qr_element.box_mm.y_mm + qr_element.box_mm.height_mm + plate
                <= template.page_height_mm - template.bleed_mm
            )
            if not inside_trim:
                issues.append(
                    _issue(
                        "qr_plate_outside_trim",
                        qr_element.id,
                        f"QR quiet zone of '{qr_element.id}' reaches past the trim line",
                        blocking=False,
                        details={**shared_details, "editable": False},
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
            height_px = asset.get("height_px")
            adjustment: ElementAdjustment = layout_state.element_adjustments.get(image_element.id, ElementAdjustment())
            effective_dpi, dpi_details = effective_image_dpi(
                image_element,
                adjustment,
                float(width_px),
                float(height_px) if isinstance(height_px, (int, float)) else None,
            )
            thresholds: dict[str, object] = {
                "effective_dpi": round(effective_dpi, 2),
                "minimum_dpi": product.minimum_dpi,
                "warning_dpi": product.warning_dpi,
                "recommended_dpi": product.recommended_dpi,
                **dpi_details,
            }
            if effective_dpi < product.minimum_dpi:
                issues.append(
                    _issue(
                        "image_dpi_too_low",
                        field.id,
                        f"Image in field '{field.id}' is below the minimum DPI",
                        details=thresholds,
                    )
                )
            elif effective_dpi < product.warning_dpi:
                issues.append(
                    _issue(
                        "image_dpi_warning",
                        field.id,
                        f"Image in field '{field.id}' is below the recommended DPI",
                        blocking=False,
                        details=thresholds,
                    )
                )

    return QualityReport(issues=issues, blocking=any(issue.blocking for issue in issues))
