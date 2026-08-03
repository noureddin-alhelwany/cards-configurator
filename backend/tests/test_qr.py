"""QR geometry and validation.

The bug these pin down: the gate encoded the template's static `value`, so it reported the
same two numbers for every input, while the renderer drew a symbol inset behind segno's
default 4-module border. A 22mm box therefore printed a 16.67mm symbol and silently failed
the product's 18mm minimum.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from cards_configurator_backend.quality import validate_current_draft
from cards_configurator_backend.registries.loader import load_registry_bundle
from cards_configurator_backend.registries.schemas import (
    BoxMm,
    LayoutState,
    QrElementDefinition,
)
from cards_configurator_backend.urls import (
    QR_QUIET_ZONE_MODULES,
    build_qr_svg,
    qr_module_count,
    resolve_qr_value,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
SHORT_URL = "https://example.com/review"
LONG_URL = "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4"


def _bundle():
    return load_registry_bundle(REPO_ROOT / "registries")


def _template():
    bundle = _bundle()
    return next(t for t in bundle.templates if t.id == "proof_a6_card" and t.version == "1.6.0")


def _draft(text_values: dict[str, str]):
    from cards_configurator_backend.drafts.schemas import DraftState

    default_text_values = {
        "businessName": "Studio One",
        "headline": "Scanne den QR-Code",
        "body": "Kurz und klar.",
    }
    default_text_values.update(text_values)
    return DraftState(
        id=1,
        name="draft",
        use_case_id="google_reviews",
        product_id="a6_card",
        template_id="proof_a6_card",
        template_version="1.6.0",
        layout_state=LayoutState(
            variant_id="",
            element_adjustments={},
            text_values=default_text_values,
            asset_values={},
        ),
    )


def test_symbol_has_no_built_in_border() -> None:
    """The element box must BE the symbol, so `1 module == box / module_count` holds."""
    svg = build_qr_svg(SHORT_URL).decode("utf-8")
    modules = qr_module_count(SHORT_URL)
    assert f'width="{modules}"' in svg, svg[:200]
    assert f'height="{modules}"' in svg
    # segno's default border would make the intrinsic size modules + 8.
    assert f'width="{modules + 8}"' not in svg


def test_module_count_grows_with_url_length() -> None:
    """The premise of the whole fix: a longer URL is a denser symbol in the same box."""
    assert qr_module_count(LONG_URL) > qr_module_count(SHORT_URL)


def test_colour_reaches_the_symbol() -> None:
    assert "#1f1a17" in build_qr_svg(SHORT_URL, dark="#1f1a17").decode("utf-8")


def test_resolve_prefers_the_customer_url_over_the_template_default() -> None:
    template = _template()
    layout = LayoutState(variant_id="", element_adjustments={}, text_values={"qrTarget": LONG_URL}, asset_values={})
    assert resolve_qr_value(template, layout) == LONG_URL

    empty = LayoutState(variant_id="", element_adjustments={}, text_values={}, asset_values={})
    static_value = next(e for e in template.elements if e.kind == "qr").value
    assert resolve_qr_value(template, empty) == static_value


def _report_for(url: str, *, box_width_mm: float | None = None):
    """Validate a draft, optionally shrinking the QR box so a finding is guaranteed."""
    bundle = _bundle()
    template = next(t for t in bundle.templates if t.version == "1.6.0")
    if box_width_mm is not None:
        qr_element = next(e for e in template.elements if e.kind == "qr")
        qr_element.box_mm.width_mm = box_width_mm
        qr_element.box_mm.height_mm = box_width_mm
    return validate_current_draft(REPO_ROOT / "data", bundle, _draft({"qrTarget": url}))


def test_validation_uses_the_customer_url_not_the_static_value() -> None:
    """Before the fix both URLs produced identical numbers for every input.

    The box is shrunk below the product minimum so `qr_too_small` fires either way and the
    reported module count is observable.
    """

    def module_counts(report) -> set[int]:
        return {
            int(issue.details["module_count"])
            for issue in report.issues
            if issue.path == "proof-qr" and "module_count" in issue.details
        }

    short_modules = module_counts(_report_for(SHORT_URL, box_width_mm=10))
    long_modules = module_counts(_report_for(LONG_URL, box_width_mm=10))

    assert short_modules == {qr_module_count(SHORT_URL)}
    assert long_modules == {qr_module_count(LONG_URL)}
    assert short_modules != long_modules


def test_pitch_is_the_box_divided_by_the_module_count() -> None:
    """The box IS the symbol, so the pitch is a plain division.

    The old formula subtracted the quiet zone from the box, which described neither what was
    drawn nor what was printed. The box is shrunk here so a finding is guaranteed and the
    reported numbers are observable rather than conditionally skipped.
    """
    box_width_mm = 10.0
    report = _report_for(SHORT_URL, box_width_mm=box_width_mm)
    reported = next(i.details for i in report.issues if i.path == "proof-qr" and "effective_module_mm" in i.details)

    assert reported["effective_width_mm"] == pytest.approx(box_width_mm, abs=0.01)
    assert reported["effective_module_mm"] == pytest.approx(box_width_mm / qr_module_count(SHORT_URL), abs=0.001)
    assert reported["encoded_length"] == len(SHORT_URL)


def test_shipped_template_satisfies_the_quiet_zone_for_a_realistic_url() -> None:
    """The shipped 2mm zone was below the 3.52mm the standard needs; it is now 4mm."""
    report = validate_current_draft(REPO_ROOT / "data", _bundle(), _draft({"qrTarget": SHORT_URL}))
    assert [i for i in report.issues if i.code == "qr_quiet_zone_too_small"] == []


def test_quiet_zone_finding_never_blocks_the_customer() -> None:
    """A SHORTER url needs a WIDER zone, so this can fire on input the customer chose.

    Blocking would refuse an order over a template value the customer cannot reach, so the
    finding is a warning addressed to the template author.
    """
    template = _template()
    qr_element = next(e for e in template.elements if e.kind == "qr")
    tiny_zone = qr_element.model_copy(update={"quiet_zone_mm": 0.1})
    bundle = _bundle()
    live_template = next(t for t in bundle.templates if t.version == "1.6.0")
    live_template.elements[live_template.elements.index(qr_element)] = tiny_zone

    report = validate_current_draft(REPO_ROOT / "data", bundle, _draft({"qrTarget": SHORT_URL}))
    findings = [i for i in report.issues if i.code == "qr_quiet_zone_too_small"]
    assert findings, [i.code for i in report.issues]
    assert findings[0].blocking is False
    assert findings[0].details["editable"] is False
    assert findings[0].details["required_quiet_zone_mm"] == pytest.approx(
        QR_QUIET_ZONE_MODULES * qr_element.box_mm.width_mm / qr_module_count(SHORT_URL), abs=0.01
    )


def test_a_stretched_qr_box_is_rejected_by_the_schema() -> None:
    with pytest.raises(ValueError, match="square"):
        QrElementDefinition(
            kind="qr",
            id="stretched",
            box_mm=BoxMm(x_mm=0, y_mm=0, width_mm=22, height_mm=16),
            z_index=1,
            value=SHORT_URL,
        )


def test_quiet_zone_background_defaults_to_light() -> None:
    """A transparent quiet zone is not a quiet zone on coloured artwork."""
    element = QrElementDefinition(
        kind="qr",
        id="qr",
        box_mm=BoxMm(x_mm=0, y_mm=0, width_mm=22, height_mm=22),
        z_index=1,
        value=SHORT_URL,
    )
    assert element.background == "#ffffff"


def test_low_contrast_qr_codes_are_reported() -> None:
    template = _template()
    qr_element = next(e for e in template.elements if e.kind == "qr")
    qr_element.color = "#ffffff"
    qr_element.background = "#ffffff"

    bundle = _bundle()
    live_template = next(t for t in bundle.templates if t.version == "1.6.0")
    live_qr_element = next(e for e in live_template.elements if e.kind == "qr")
    live_qr_element.color = "#ffffff"
    live_qr_element.background = "#ffffff"

    report = validate_current_draft(REPO_ROOT / "data", bundle, _draft({"qrTarget": SHORT_URL}))
    issue = next(issue for issue in report.issues if issue.code == "qr_contrast_too_low")

    assert report.blocking is True
    assert issue.blocking is True
    assert issue.details["minimum_contrast_ratio"] == pytest.approx(3.0)
