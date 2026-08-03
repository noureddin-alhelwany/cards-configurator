---
id: TPL-15
type: story
priority: must
status: done
depends_on: [TPL-14]
title: "Produktionsvorschau erzeugen"
---

# TPL-15 – Produktionsvorschau erzeugen

## Acceptance Criteria

- [x] Preview und Source werden gemeinsam gerendert, wobei Source oberhalb von Preview liegt.
- [x] Source kann ein- und ausgeblendet werden und ihre Deckkraft ist von 0 bis 100 Prozent regelbar.
- [x] Neue `source_asset`-Felder werden gelesen, alte `background_asset`-Daten bleiben kompatibel.

## Result

Die Template-Tool-Vorschau trennt jetzt `Preview` und `Source` sichtbar:

- `Preview` wird als statisches Mockup unter dem Renderer eingeblendet.
- `Source` liegt als eigenes Overlay darüber und kann ein- und ausgeblendet werden.
- Die Overlay-Deckkraft ist per Slider von 0 bis 100 Prozent steuerbar.
- Registries und Typen kennen zusätzlich `source_asset` und lesen alte `background_asset`-Daten weiter.

## Verification

- `backend/.venv/bin/pytest -q backend/tests/test_template_svg_import.py`
- `bash -lc 'COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend test -- src/templateTool/TemplateToolPage.test.tsx'`
- `bash -lc 'COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend typecheck'`
- `bash -lc 'COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build'`
- `timeout 20 backend/.venv/bin/pytest -q backend/tests/test_registries.py::test_app_loads_registries_on_startup` timed out while waiting for `TestClient` startup
