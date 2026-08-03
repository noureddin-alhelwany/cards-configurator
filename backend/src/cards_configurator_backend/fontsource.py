from __future__ import annotations

from functools import lru_cache
from typing import Any

import httpx

FONTSOURCE_API_BASE = "https://api.fontsource.org/v1"


def _request_json(path: str) -> Any:
    response = httpx.get(f"{FONTSOURCE_API_BASE}{path}", timeout=60.0, follow_redirects=True)
    response.raise_for_status()
    return response.json()


def _font_sort_key(item: dict[str, Any]) -> tuple[str, str]:
    return (str(item.get("family") or item.get("id") or "")).casefold(), str(item.get("id") or "")


def _pick_default_variant(font: dict[str, Any]) -> tuple[str, int, str]:
    variants = font.get("variants")
    if not isinstance(variants, dict):
        raise TypeError(f"Fontsource font '{font.get('id')}' does not expose any file variants")

    preferred_subsets = []
    default_subset = font.get("defSubset")
    if isinstance(default_subset, str) and default_subset:
        preferred_subsets.append(default_subset)
    preferred_subsets.append("latin")

    preferred_weights = ["400", "regular", "500", "700"]
    preferred_styles = ["normal", "italic"]

    def variant_url(candidate: dict[str, Any]) -> str | None:
        url = candidate.get("url")
        if not isinstance(url, dict):
            return None
        woff2 = url.get("woff2")
        if isinstance(woff2, str) and woff2:
            return woff2
        woff = url.get("woff")
        if isinstance(woff, str) and woff:
            return woff
        ttf = url.get("ttf")
        if isinstance(ttf, str) and ttf:
            return ttf
        return None

    for weight_key in preferred_weights:
        weight_group = variants.get(weight_key)
        if not isinstance(weight_group, dict):
            continue
        for style_key in preferred_styles:
            style_group = weight_group.get(style_key)
            if not isinstance(style_group, dict):
                continue
            for subset_key in preferred_subsets:
                subset_group = style_group.get(subset_key)
                if not isinstance(subset_group, dict):
                    continue
                file_url = variant_url(subset_group)
                if file_url:
                    weight_value = 400 if weight_key == "regular" else int(weight_key)
                    style_value = style_key if style_key in {"normal", "italic"} else "normal"
                    return file_url, weight_value, style_value

    for weight_key, styles in variants.items():
        if not isinstance(styles, dict):
            continue
        for style_key, subsets in styles.items():
            if not isinstance(subsets, dict):
                continue
            for subset_key, candidate in subsets.items():
                if not isinstance(candidate, dict):
                    continue
                file_url = variant_url(candidate)
                if not file_url:
                    continue
                try:
                    weight_value = 400 if weight_key == "regular" else int(weight_key)
                except (TypeError, ValueError):
                    weight_value = 400
                style_value = style_key if style_key in {"normal", "italic"} else "normal"
                return file_url, weight_value, style_value

    raise ValueError(f"Fontsource font '{font.get('id')}' does not expose a loadable font face")


@lru_cache(maxsize=1)
def load_fontsource_catalog() -> list[dict[str, Any]]:
    payload = _request_json("/fonts")
    if not isinstance(payload, list):
        raise TypeError("Fontsource catalog response must be a list")

    catalog: list[dict[str, Any]] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        if item.get("type") == "icons":
            continue
        font_id = item.get("id")
        family = item.get("family")
        if not isinstance(font_id, str) or not font_id:
            continue
        if not isinstance(family, str) or not family:
            continue
        catalog.append(
            {
                "id": font_id,
                "family": family,
                "type": item.get("type"),
                "category": item.get("category"),
                "variable": bool(item.get("variable", False)),
                "subsets": item.get("subsets") if isinstance(item.get("subsets"), list) else [],
            }
        )

    catalog.sort(key=_font_sort_key)
    return catalog


@lru_cache(maxsize=256)
def load_fontsource_font_face(font_id: str) -> dict[str, Any]:
    payload = _request_json(f"/fonts/{font_id}")
    if not isinstance(payload, dict):
        raise TypeError(f"Fontsource font detail for '{font_id}' must be an object")

    family = payload.get("family")
    if not isinstance(family, str) or not family:
        raise ValueError(f"Fontsource font '{font_id}' is missing a family name")

    file_url, weight, style = _pick_default_variant(payload)
    return {
        "id": payload.get("id") or font_id,
        "family": family,
        "file": file_url,
        "weight": weight,
        "style": style,
    }
