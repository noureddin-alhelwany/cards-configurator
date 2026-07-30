---
id: TECH-03
type: technical
title: "Shared renderer proof"
status: done
priority: must
depends_on: [TECH-01, TECH-02]
verification: rendering
context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
started_at: 2026-07-30
completed_at: 2026-07-30
---

# TECH-03 — Shared renderer proof

## Objective

Prove that one React DesignRenderer can render a physical page fixture with text, logo and QR.

## Acceptance criteria

- [x] DesignRenderer accepts a typed template and layout state.
- [x] One A6-with-bleed fixture renders in the browser.
- [x] Geometry is based on millimeters/normalized values.
- [x] A bundled local font is loaded deterministically.
- [x] Text, PNG logo and Segno-generated QR are displayed.
- [x] A deterministic screenshot test exists.
- [x] No second layout implementation is introduced.

## Implementation notes

- Hard-coded example content is acceptable for this technical proof.
- Do not build crop controls or dynamic form UI yet.

## Result

- Changed: added a typed shared `DesignRenderer`, a `/render/proof` proof page, bundled proof assets and fonts, and a deterministic screenshot baseline for the browser render.
- Decisions: keep layout geometry in millimeters with a single renderer path for both preview and production proof flows.
- Verification: `backend/.venv/bin/pytest backend/tests/test_rendering_proof.py -q`, `make lint`, `make typecheck`, `make test`, `make test-render`, `make build`.
- Remaining risks: none identified for this proof slice.
