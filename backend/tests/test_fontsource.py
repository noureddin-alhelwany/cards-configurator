from __future__ import annotations

from cards_configurator_backend import fontsource


def test_fontsource_catalog_filters_icons_and_sorts(monkeypatch) -> None:
    fontsource.load_fontsource_catalog.cache_clear()

    monkeypatch.setattr(
        fontsource,
        "_request_json",
        lambda path: [
            {"id": "zeta", "family": "Zeta", "type": "google", "category": "sans-serif", "variable": False, "subsets": ["latin"]},
            {"id": "icons", "family": "Icons", "type": "icons", "category": "icons", "variable": False, "subsets": []},
            {"id": "alpha", "family": "Alpha", "type": "google", "category": "serif", "variable": True, "subsets": ["latin"]},
        ],
    )

    catalog = fontsource.load_fontsource_catalog()

    assert [item["id"] for item in catalog] == ["alpha", "zeta"]
    assert all(item["type"] != "icons" for item in catalog)


def test_fontsource_font_face_prefers_400_normal_latin(monkeypatch) -> None:
    fontsource.load_fontsource_font_face.cache_clear()

    monkeypatch.setattr(
        fontsource,
        "_request_json",
        lambda path: {
            "id": "inter",
            "family": "Inter",
            "defSubset": "latin",
            "variants": {
                "400": {
                    "normal": {
                        "latin": {"url": {"woff2": "https://example.test/inter-400.woff2"}},
                    }
                }
            },
        },
    )

    face = fontsource.load_fontsource_font_face("inter")

    assert face == {
        "id": "inter",
        "family": "Inter",
        "file": "https://example.test/inter-400.woff2",
        "weight": 400,
        "style": "normal",
    }
