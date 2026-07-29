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
