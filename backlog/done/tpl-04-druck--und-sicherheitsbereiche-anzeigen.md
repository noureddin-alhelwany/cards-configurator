---
id: TPL-04
type: story
priority: must
status: done
depends_on: [TPL-01]
title: "Druck- und Sicherheitsbereiche anzeigen"
---

# TPL-04 – Druck- und Sicherheitsbereiche anzeigen

## Acceptance Criteria

- [x] Dokumentkante, Schnittkante, Beschnitt und Safe Area sind sichtbar.
- [x] Hilfslinien sind ausblendbar.
- [x] Hilfslinien erscheinen nicht im Render.

## Result

- Guide-Layer mit Dokumentkante, Beschnitt, Schnittkante und Safe Areas in `DesignRenderer` ergänzt.
- Hilfslinien lassen sich im internen Template-Tool ein- und ausblenden.
- Produktionsrender bleibt frei von Preview-Hilfslinien.

## Verification

- `./node_modules/.bin/vitest run src/design/DesignRenderer.test.tsx`
- `./node_modules/.bin/vitest run src/templateTool/TemplateToolPage.test.tsx`
- `./node_modules/.bin/vitest run src/App.test.tsx`
- `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
