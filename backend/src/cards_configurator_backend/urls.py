from __future__ import annotations

import base64
from io import BytesIO
from urllib.parse import urlparse, urlunparse

import segno


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


def build_qr_data_url(value: str) -> str:
    normalized_value = normalize_url(value)
    qr = segno.make(normalized_value, error="m")
    qr_buffer = BytesIO()
    qr.save(qr_buffer, kind="svg")
    encoded = base64.b64encode(qr_buffer.getvalue()).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"
