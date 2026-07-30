---
id: UI-19
type: user-story
title: "Lade-, Leer-, Fehler- und Nicht-verfügbar-Zustände umsetzen"
epic: "UI"
status: done
priority: must
depends_on:
  - UI-18
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T21:08:49Z
completed_at: 2026-07-30T21:08:49Z
---

# UI-19 – Lade-, Leer-, Fehler- und Nicht-verfügbar-Zustände umsetzen

## User Story

Als Nutzer möchte ich bei jedem Systemzustand eine verständliche Rückmeldung erhalten, damit die Oberfläche nie kaputt oder unvollständig wirkt.

## Akzeptanzkriterien

Jede datenabhängige Komponente besitzt mindestens:

- Ladezustand
- Erfolgszustand
- Leerzustand
- Fehlerzustand
- deaktivierten Zustand

Zusätzlich:

- Layoutsprünge werden möglichst vermieden.
- Fehlermeldungen bieten eine sinnvolle nächste Aktion.
- Die Eingaben bleiben bei temporären Fehlern erhalten.
- Technische Details werden nicht im Nutzer-Frontend dargestellt.
- Wiederholen- oder Zurück-Aktionen werden dort angeboten, wo sie sinnvoll sind.

## Result

- Changed: Lade-, Fehler- und Leerzustände sind jetzt als gemeinsame `StateMessage`-Komponente in Auswahl-, Auftrags- und Produktionsansicht vereinheitlicht.
- Changed: Die Seiten bieten sinnvolle nächste Schritte, statt technische Details oder rohe Backendfehler zu zeigen.
- Changed: Temporäre Fehler lassen Eingaben und Entwurfszustand unangetastet.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
