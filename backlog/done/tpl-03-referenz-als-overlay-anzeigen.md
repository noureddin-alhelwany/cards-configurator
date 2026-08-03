---
id: TPL-03
type: story
priority: must
status: done
depends_on: [TPL-02]
title: "Referenz als Overlay anzeigen"
---

# TPL-03 – Referenz als Overlay anzeigen

## Acceptance Criteria

- [x] Referenz kann ein- und ausgeblendet werden.
- [x] Deckkraft ist regelbar.
- [x] Beide Assets bleiben deckungsgleich.

## Result

- Interne Route `/template-tool` ergänzt.
- Design-Auswahl, Variante und Referenz-Overlay werden in einer gemeinsamen Ansicht gerendert.
- Referenzbild kann ein- und ausgeblendet werden; die Deckkraft ist regelbar.
- Gemeinsamer Registry-Loader wird jetzt auch vom Selection-Flow genutzt.

## Verification

- `./node_modules/.bin/vitest run src/templateTool/TemplateToolPage.test.tsx`
- `./node_modules/.bin/vitest run src/App.test.tsx`
- `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
