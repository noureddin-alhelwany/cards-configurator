---
id: TPL-10
type: story
priority: must
status: done
depends_on: [TPL-09]
title: "Schnelle Live-Preview anzeigen"
---

# TPL-10 – Schnelle Live-Preview anzeigen

## Acceptance Criteria

- [ ] Preview zeigt Hintergrund, Texte und echten Test-QR.
- [ ] Referenzoverlay kann gleichzeitig aktiv sein.
- [ ] Preview ist als Bearbeitungsansicht gekennzeichnet.

## Result

Die Template-Tool-Vorschau rendert jetzt Hintergrund, Texte und den echten
Test-QR gleichzeitig mit dem Referenzoverlay. Zusätzlich ist die Vorschau als
Bearbeitungsansicht markiert, damit der interne Bearbeitungsmodus klar erkennbar
ist.

## Verification

- `./node_modules/.bin/vitest run src/templateTool/TemplateToolPage.test.tsx`
- `./node_modules/.bin/vitest run src/App.test.tsx`
- `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
