---
id: TECH-02
type: technical
title: "Configuration registries and schemas"
status: done
priority: must
depends_on: [TECH-01]
verification: backend
context_docs: [docs/DOMAIN_MODEL.md, docs/TEMPLATE_AND_RENDERING.md]
started_at: 2026-07-30
completed_at: 2026-07-30
---

# TECH-02 — Configuration registries and schemas

## Objective

Implement typed, versioned file-backed registries for use cases, products and templates.

## Acceptance criteria

- [ ] Pydantic schemas cover use case, product and initial template definition.
- [ ] Repository config directories and one valid fixture of each type exist.
- [ ] Application validates registries at startup.
- [ ] Invalid config yields actionable diagnostics and is not exposed as active.
- [ ] Template ID/version uniqueness is enforced.
- [ ] Registry unit tests cover valid, invalid and duplicate definitions.

## Implementation notes

- No SQL tables for use cases, products or templates.
- Schema must be sufficient for the shared renderer proof, not a generic template-builder language.

## Result

- Changed: added typed file-backed registries for use cases, products and templates; wired startup loading; added shared proof fixture APIs; added the deterministic proof screenshot baseline and backend render/PDF validation.
- Decisions: keep registries file-backed and versioned, with startup validation and actionable diagnostics instead of database records.
- Verification: `backend/.venv/bin/pytest backend/tests/test_registries.py backend/tests/test_app.py -q`, `backend/.venv/bin/pytest backend/tests/test_rendering_proof.py -q`, `backend/.venv/bin/pytest backend/tests/test_pdf_pipeline.py -q`, `make lint`, `make typecheck`, `make test`, `make test-render`, `make build`.
- Remaining risks: the startup hook still uses FastAPI `on_event`; acceptable for the MVP bootstrap but easy to migrate to lifespan later.
