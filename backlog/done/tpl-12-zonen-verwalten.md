---
id: TPL-12
type: story
priority: should
status: done
depends_on: [TPL-05]
title: "Zonen verwalten"
---

# TPL-12 – Zonen verwalten

## Acceptance Criteria

- [x] Liste zeigt Typ, Variable, Sichtbarkeit und Sperrstatus.
- [x] Zonen können ausgewählt, gesperrt und ausgeblendet werden.
- [x] Renderreihenfolge ist anpassbar.

## Result

Die Zonenverwaltung im Template-Tool zeigt jetzt eine echte Sidebar-Liste mit Typ, Zuordnung, Sichtbarkeit, Sperrstatus und Reihenfolge.
Zonen lassen sich auswählen, ein- und ausblenden, sperren und per Hoch/Runter umsortieren; gesperrte Zonen blockieren Drag/Resize.

## Verification

- `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend typecheck`
- `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend test -- src/templateTool/TemplateToolPage.test.tsx`
- `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint` (bestehende Warnungen in anderen Dateien, keine Fehler im TPL-12-Pfad)
