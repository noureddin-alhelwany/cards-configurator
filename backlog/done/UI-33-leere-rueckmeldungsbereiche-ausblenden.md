---
id: UI-33
type: story
priority: should
status: done
depends_on: [UI-15, UI-16]
title: "Leere Rückmeldungsbereiche ausblenden"
---

# UI-33 – Leere Rückmeldungsbereiche ausblenden

## User Story

Als Nutzer beziehungsweise Produktteam möchte ich diese Änderung, damit der neue produktorientierte Flow einfach, kontrolliert und verständlich bleibt.

## Acceptance Criteria

- [x] Ein leerer Bereich mit „0 Hinweise“ wird nicht dargestellt.
- [x] Bei fehlerfreiem Zustand kann kompakt „Alles sieht gut aus“ erscheinen.
- [x] Warnungen und Fehler erscheinen nur bei tatsächlichem Bedarf.
- [x] Probleme verlinken auf den betroffenen Bereich.

## Result

Die Rückmeldungsbox blendet leere Zustände aus und zeigt stattdessen einen kompakten positiven Hinweis. Fehler werden als klickbare Einträge dargestellt, die zum betroffenen Feld springen.

## Verification

- `make test`
- `make build`
