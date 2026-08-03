---
id: TPL-06
type: story
priority: must
status: in-progress
depends_on: [TPL-05]
title: "Variable einer Zone zuweisen"
---

# TPL-06 – Variable einer Zone zuweisen

## Acceptance Criteria

- [x] Kompatible Variablen können zugewiesen werden.
- [x] Technischer Key und sichtbare Bezeichnung sind getrennt.
- [x] Pflichtstatus und Standardwert sind definierbar.

## Result

Die Template-Tool-Zone-Editor-Ansicht unterstützt jetzt kompatible Variablen pro Zone.
Technischer Key, sichtbare Bezeichnung, Pflichtstatus und Standardwert werden getrennt
bearbeitet und im Preview-Flow übernommen.

## Verification

- `./node_modules/.bin/vitest run src/templateTool/TemplateToolPage.test.tsx`
- `./node_modules/.bin/vitest run src/design/DesignRenderer.test.tsx`
- `./node_modules/.bin/vitest run src/App.test.tsx`
- `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
- `pytest backend/tests/test_registries.py backend/tests/test_template_svg_import.py`
