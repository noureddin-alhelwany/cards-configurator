"""Contract tests for the text auto-fit heuristic.

The same fixture is asserted by `frontend/src/design/textFit.test.ts`. That pairing is what
keeps the renderer and the quality gate from disagreeing about whether a card is printable:
the code cannot be shared across Python and TypeScript, so the expectations are.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from cards_configurator_backend.quality import (
    AVG_GLYPH_WIDTH_EM,
    DEFAULT_MIN_FIT_SCALE,
    _estimate_text_scale,
    _min_fit_scale,
)
from cards_configurator_backend.registries.schemas import BoxMm, TextElementDefinition

FIXTURE = Path(__file__).resolve().parents[2] / "registries" / "fixtures" / "text_fit_cases.json"


def _load() -> dict[str, Any]:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def _element(case_input: dict[str, Any]) -> TextElementDefinition:
    return TextElementDefinition(
        kind="text",
        id="fixture",
        box_mm=BoxMm(
            x_mm=0,
            y_mm=0,
            width_mm=case_input["box_width_mm"],
            height_mm=case_input["box_height_mm"],
        ),
        z_index=1,
        text="",
        font_family="Proof Sans",
        font_size_mm=case_input["font_size_mm"],
        letter_spacing_em=case_input.get("letter_spacing_em"),
        line_height=case_input["line_height"],
        min_font_size_mm=case_input.get("min_font_size_mm"),
    )


def test_fixture_is_shared_with_the_frontend() -> None:
    """Guards the pairing itself: a renamed or moved fixture must fail loudly."""
    assert FIXTURE.exists(), f"shared fixture missing: {FIXTURE}"
    document = _load()
    assert document["cases"], "fixture has no cases"
    for case in document["cases"]:
        assert {"name", "input", "text", "expected"} <= case.keys(), case


@pytest.mark.parametrize("case", _load()["cases"], ids=lambda case: case["name"])
def test_text_fit_matches_shared_fixture(case: dict[str, Any]) -> None:
    tolerance = _load()["tolerance"]
    element = _element(case["input"])
    scale, raw_scale, estimated_lines = _estimate_text_scale(element, case["text"], case["input"]["max_lines"])
    expected = case["expected"]

    assert estimated_lines == expected["estimated_lines"]
    assert scale == pytest.approx(expected["scale"], abs=tolerance)
    assert raw_scale == pytest.approx(expected["raw_scale"], abs=tolerance)
    assert _min_fit_scale(element) == pytest.approx(expected["min_scale"], abs=tolerance)


def test_constants_match_the_documented_values() -> None:
    """These are duplicated in `frontend/src/design/textFit.ts` under the same names."""
    assert AVG_GLYPH_WIDTH_EM == 0.55
    assert DEFAULT_MIN_FIT_SCALE == 0.7


def test_trailing_whitespace_cannot_change_the_verdict() -> None:
    """The regression this pairing exists for.

    The gate used to validate the stripped value while the renderer fitted the raw one, so a
    trailing newline was enough to make the preview shrink text the gate considered fine.
    """
    element = _element({"box_width_mm": 70, "box_height_mm": 22, "font_size_mm": 6.8, "line_height": 1.05})
    plain = _estimate_text_scale(element, "Scanne den QR-Code", 3)
    padded = _estimate_text_scale(element, "  Scanne den QR-Code \n\n ", 3)
    assert plain == padded


def test_letter_spacing_changes_the_fit_heuristic() -> None:
    compact = _element(
        {"box_width_mm": 70, "box_height_mm": 22, "font_size_mm": 6.8, "line_height": 1.05, "letter_spacing_em": 0.0}
    )
    spaced = _element(
        {"box_width_mm": 70, "box_height_mm": 22, "font_size_mm": 6.8, "line_height": 1.05, "letter_spacing_em": 0.08}
    )

    compact_result = _estimate_text_scale(compact, "Scanne den QR-Code", 3)
    spaced_result = _estimate_text_scale(spaced, "Scanne den QR-Code", 3)

    assert spaced_result[0] <= compact_result[0]
    assert spaced_result[1] <= compact_result[1]
