---
id: TECH-04
type: technical
title: "Production render pipeline proof"
status: done
priority: must
depends_on: [TECH-03]
verification: rendering
context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md, docs/DOMAIN_MODEL.md]
started_at: 2026-07-30
completed_at: 2026-07-30
---

# TECH-04 — Production render pipeline proof

## Objective

Produce and validate a physical PDF from the shared DesignRenderer.

## Acceptance criteria

- [x] A protected/internal render route loads the same DesignRenderer.
- [x] Playwright waits for fonts and explicit render readiness.
- [x] PDF uses the configured physical page size including bleed.
- [x] pikepdf sets and validates MediaBox, BleedBox and TrimBox.
- [x] A preview image is produced from the same render.
- [x] Failures return actionable diagnostics and leave no partial final file.
- [x] Automated PDF geometry tests exist.

## Implementation notes

- RGB output is expected.
- Do not add Redis, Celery or a distributed queue.

## Result

- Changed: added the protected `/api/render/proof` pipeline that reuses the shared `DesignRenderer`, waits for fonts/render readiness, emits preview and PDF artifacts, and validates PDF geometry with `pikepdf`.
- Decisions: keep PDF output RGB and write final artifacts only after successful validation so failed renders do not leave partial final files.
- Verification: `backend/.venv/bin/pytest backend/tests/test_pdf_pipeline.py -q`, `make lint`, `make typecheck`, `make test`, `make test-render`, `make build`.
- Remaining risks: browser availability is required for render verification in CI and local runs.
