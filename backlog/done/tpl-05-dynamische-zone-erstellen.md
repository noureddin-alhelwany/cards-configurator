---
id: TPL-05
type: story
priority: must
status: done
depends_on: [TPL-03, TPL-04, TECH-TPL-02]
title: "Dynamische Zone erstellen"
---

# TPL-05 – Dynamische Zone erstellen

## Acceptance Criteria

- [x] dynamicText, fixedText und qr können als Zonen erstellt werden.
- [x] Zonen besitzen X, Y, Breite und Höhe in Millimetern.
- [x] Zonen sind verschiebbar, skalierbar und löschbar.

## Result

- Interner Zonen-Editor im Template-Tool ergänzt.
- Zonen können als `dynamicText`, `fixedText` und `qr` angelegt werden.
- X, Y, Breite und Höhe werden in Millimetern bearbeitet.
- Zonen lassen sich per Editor und Overlay verschieben, skalieren und löschen.

## Verification

- `./node_modules/.bin/vitest run src/templateTool/TemplateToolPage.test.tsx`
- `./node_modules/.bin/vitest run src/design/DesignRenderer.test.tsx`
- `./node_modules/.bin/vitest run src/App.test.tsx`
- `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
- `python -m compileall backend/src/cards_configurator_backend/registries`
