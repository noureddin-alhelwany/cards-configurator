# Quality Strategy

## Product validation

Central validation returns structured issues:

```text
code
severity: info | warning | error
field_or_element_id
message
blocking
details
```

Finalization is allowed only when no blocking issue exists.

## Required checks

- required fields
- URL normalization and validity
- text fit and line limits
- image effective DPI
- QR physical size/module size
- asset readability and supported type
- render readiness
- approval checklist

## DPI

Effective DPI must account for:

- source pixel dimensions
- visible crop
- zoom
- physical printed dimensions

Product configuration supplies recommended, warning and minimum thresholds.

The crop decides which axis is measured: `contain` keeps every pixel visible, so the denser
axis wins (`max`); `cover` crops the overflow, so the sparser axis decides (`min`). Using the
width axis alone over-reports for `cover` and lets a visibly soft image through.

Zoom is clamped to the element's declared range on read **and** on write, so the validator and
the renderer can never describe different cards.

## Findings the customer cannot fix

A finding is only blocking when the customer can act on it. Template-owned values — a quiet
zone that is too narrow for the encoded URL, a QR plate reaching past the trim line, static
element text that overflows — are reported as non-blocking warnings addressed to the template
author. Blocking there would refuse an order over something the form does not expose.

## QR

Check both:

- total printed QR size
- resulting module size including quiet zone

The operator still scans a real printed sample.

## Test levels

### Targeted during implementation

Run only tests affected by the current edit.

### Work-item completion

- `backend`: backend lint/type/unit tests.
- `frontend`: frontend lint/type/unit tests.
- `mixed`: both affected layers.
- `rendering`: renderer unit tests, deterministic fixture render and PDF checks.
- `e2e`: affected layers plus the named user-flow test.

### Milestone completion

Run the complete repository suite and build once.

## Visual regression

Use stable template fixtures with deterministic example values and local fonts.
Update baselines only when the visual change is intentional and recorded.

## Review economy

One focused review pass is the default. A second independent/subagent review is
reserved for production rendering, upload security, migrations or broad
cross-cutting changes.
