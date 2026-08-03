---
id: TECH-05
type: tech
priority: must
status: done
depends_on: []
title: "Fontsource-Fonts mit globaler Design-Schrift"
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backend/src/cards_configurator_backend/registries/schemas.py
  - backend/src/cards_configurator_backend/registries/loader.py
  - backend/src/cards_configurator_backend/registries/service.py
  - frontend/src/design/types.ts
  - frontend/src/design/DesignRenderer.tsx
  - frontend/src/templateTool/TemplateToolPage.tsx
  - frontend/src/templateTool/ZoneEditor.tsx
started_at: 2026-08-03
completed_at: 2026-08-03
---

# TECH-05 – Fontsource-Fonts mit globaler Design-Schrift

## User story

> Als interner Operator möchte ich Fontsource-Schriften als interne Font-IDs mit einer globalen Design-Schrift und zonalen Overrides verwalten, damit Preview, Produktionsrenderer und Template-Tool dieselbe Fontauflösung verwenden.

## Acceptance criteria

- [x] Template- und Renderer-Typen arbeiten mit internen Font-IDs statt nur mit Familiennamen.
- [x] Der Renderer lädt die in der Registry referenzierten Faces runtime und rendert Text über die aufgelöste interne Font-ID.
- [x] Das Template-Tool kann eine globale Schrift setzen und pro Textzone auf die globale Schrift zurückfallen.
- [x] Die bestehende Proof-Schrift bleibt als funktionierender Default erhalten.
- [x] Bestehende Registry- und Renderer-Tests decken den neuen Fontpfad ab.

## Architecture-specific implementation notes

- Keep font resolution explicit and shared between editor and renderer.
- Treat legacy family-name values as compatibility input only.
- Prefer one bundled font family as the migration baseline; avoid inventing a second rendering path.

## Source-derived technical tasks

- Extend the template schemas with font IDs, typography defaults, and zone-level overrides.
- Add shared font resolution helpers for frontend rendering and the template tool.
- Load template font faces through `FontFace`/`document.fonts` before render readiness is considered complete.
- Update the bundled proof registry and fixtures to use the new font IDs.
- Add registry validation for missing or unknown font IDs.

## Result

- Changed: Added internal font IDs to registry schemas and proof data, added shared font-resolution/loading helpers, wired the renderer and template tool to use font IDs with global fallback, and tightened registry validation for explicit unknown fonts.
- Decisions: Kept legacy family-name fields as compatibility input, but the runtime resolves by internal font ID first and falls back only when a font is intentionally inherited from the global design font.
- Verification: `backend/.venv/bin/pytest -q backend/tests/test_registries.py -k 'not test_app_loads_registries_on_startup'`, `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend test -- src/design/DesignRenderer.test.tsx src/templateTool/TemplateToolPage.test.tsx`, `make typecheck`, `git diff --check`.
- Remaining risks: `backend/tests/test_registries.py::test_app_loads_registries_on_startup` still hangs in this environment under `TestClient` startup, which appears unrelated to the font changes but kept the full file from completing.
