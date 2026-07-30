---
id: UI-15
type: user-story
title: "Validierung nutzerfreundlich darstellen"
epic: "UI"
status: done
priority: should
depends_on:
  - UI-13
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T20:37:12Z
completed_at: 2026-07-30T20:37:12Z
---

# UI-15 – Validierung nutzerfreundlich darstellen

## User Story

Als Nutzer möchte ich verständlich erkennen, was noch fehlt, damit ich meine Karte ohne technische Kenntnisse fertigstellen kann.

## Akzeptanzkriterien

- Technische Backendmeldungen werden in verständliche UI-Texte übersetzt.
- Fehler erscheinen direkt beim betroffenen Feld.
- Fehler werden nicht vorschnell vor der ersten Interaktion angezeigt.
- Eine Zusammenfassung erscheint nur, wenn mehrere Probleme den Abschluss verhindern.
- Fehler und Warnungen werden unterschieden.
- Warnungen blockieren den Nutzer nur, wenn dies technisch notwendig ist.
- Die Vorschau kann auch mit unvollständigen Eingaben dargestellt werden.
- Demo-Inhalte und echte Nutzereingaben sind intern unterscheidbar.
- Nach der Korrektur verschwindet die Meldung automatisch.
- Meldungen sind für Screenreader mit dem jeweiligen Feld verknüpft.

## Result

- Changed: Backend-Validierungen werden in nutzerfreundliche Texte übersetzt und direkt an den betroffenen Feldern angezeigt.
- Changed: Fehler erscheinen erst nach Interaktion oder im Abschluss, und die Zusammenfassung zeigt nur verständliche Hinweise.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
