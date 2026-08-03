from __future__ import annotations

import base64
from io import BytesIO
from urllib.parse import urlparse, urlunparse

import segno

from .registries.schemas import LayoutState, TemplateDefinition

# Shared by the renderer and the quality gate. A constant because the two used to pass "m"
# independently and matched only by luck -- a different level changes the module count, and
# with it the printed module pitch the gate is meant to check.
QR_ERROR_LEVEL = "m"

QR_DARK_DEFAULT = "#000000"

# Quiet zone required by ISO/IEC 18004, in modules.
QR_QUIET_ZONE_MODULES = 4


def normalize_url(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        return stripped

    candidate = stripped
    if "://" not in candidate:
        candidate = f"https://{candidate}"

    parsed = urlparse(candidate)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("URL must use http or https")
    if not parsed.netloc:
        raise ValueError("URL is missing a host")
    if any(character.isspace() for character in candidate):
        raise ValueError("URL must not contain whitespace")

    return urlunparse(parsed)


def resolve_qr_value(template: TemplateDefinition, layout_state: LayoutState) -> str:
    """The URL that will actually be encoded on the card.

    One resolution path for the renderer and the quality gate. The gate used to encode the
    template's static `value` instead, so it reported the same numbers for every input while
    a longer customer URL produced a denser symbol nobody ever validated.
    """
    url_field = next((field for field in template.fields if field.type == "url"), None)
    if url_field is not None:
        value = layout_state.text_values.get(url_field.id, "").strip()
        if value:
            return value

    qr_element = next((element for element in template.elements if element.kind == "qr"), None)
    return qr_element.value if qr_element is not None else ""


def build_qr_svg(value: str, *, dark: str = QR_DARK_DEFAULT, error_correction: str = QR_ERROR_LEVEL) -> bytes:
    """Render the QR symbol as SVG with no built-in border.

    `border=0` makes the element box the symbol itself, so one module is exactly
    `box_width_mm / module_count`. segno's default 4-module border instead shrinks the
    printed symbol inside the box -- the reason the shipped 22mm box printed a 16.67mm
    symbol and failed the product's 18mm minimum unnoticed.

    The quiet zone is drawn by the renderer as a light plate around the box, expressed in
    millimetres, which is the unit the schema and the validator speak.
    """
    qr = segno.make(normalize_url(value), error=error_correction)
    buffer = BytesIO()
    # `light=None` keeps the symbol background transparent; the plate provides the light.
    qr.save(buffer, kind="svg", border=0, dark=dark, light=None)
    return buffer.getvalue()


def build_qr_data_url(value: str, *, dark: str = QR_DARK_DEFAULT, error_correction: str = QR_ERROR_LEVEL) -> str:
    encoded = base64.b64encode(build_qr_svg(value, dark=dark, error_correction=error_correction)).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"


def qr_module_count(value: str) -> int:
    """Modules per side, excluding any border."""
    qr = segno.make(normalize_url(value), error=QR_ERROR_LEVEL)
    width, _height = qr.symbol_size(border=0)
    return int(width)
