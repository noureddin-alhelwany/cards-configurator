---
id: UI-24
type: story
title: "UI-Textsystem zentralisieren"
epic: "10 — Auftragsverwaltung"
status: done
priority: should
depends_on: [UI-22]
verification: mixed
context_docs: [PROJECT_CONTEXT.md]
started_at: 2026-07-30T21:45:00Z
completed_at: 2026-07-30T22:20:41Z
---

## User Story

Als Produktteam möchte ich alle sichtbaren Texte zentral verwalten, damit Bezeichnungen konsistent und später übersetzbar sind.

## Akzeptanzkriterien

- [x] Sichtbare Texte stehen nicht verstreut in Komponenten.
- [x] Buttons verwenden einheitliche Bezeichnungen.
- [x] Technische Namen werden über eine UI-Mapping-Schicht übersetzt.
- [x] Fehlermeldungen sind zentral definiert.
- [x] Die Struktur unterstützt später Deutsch und Englisch.
- [x] Backendfehlermeldungen werden nicht direkt ausgegeben.
- [x] Texte können angepasst werden, ohne die Komponentenlogik zu verändern.
- [x] Texte für Use Cases, Produkte, Templates und Felder können aus Konfigurationen kommen.

## Result

- Changed: Sichtbare UI-Texte für Auswahl, Inhalte, Auftrag und Proof sind in `frontend/src/ui/text.ts` zentralisiert und in den betroffenen Seiten/Komponenten verdrahtet.
- Changed: Fehlermeldungen laufen über zentrale UI-Copy statt direkt aus den Flows oder Backends zu kommen.
- Changed: Reset- und Aktionslabels sind getrennt, damit Feld-Reset, Inhalts-Reset und Layout-Reset eindeutige Bezeichnungen haben.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
