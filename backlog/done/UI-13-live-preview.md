---
id: UI-13
type: user-story
title: "Live-Vorschau als eigenständige Komponente erstellen"
epic: "UI"
status: done
priority: should
depends_on:
  - UI-12
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T20:37:12Z
completed_at: 2026-07-30T20:37:12Z
---

# UI-13 – Live-Vorschau als eigenständige Komponente erstellen

## User Story

Als Nutzer möchte ich jede Änderung direkt auf meiner Karte sehen, damit ich das Ergebnis jederzeit beurteilen kann.

## Akzeptanzkriterien

- Die Vorschau ist unabhängig vom Formular implementiert.
- Die Vorschau verwendet dieselben Daten wie die spätere Druckausgabe.
- Änderungen an Text, Bildern, Varianten und URL werden direkt übernommen.
- Ein Ladezustand ist vorhanden.
- Ein Fehler in der Vorschau blockiert nicht das gesamte Formular.
- Die Vorschau kann auf mobilen Geräten separat vergrößert werden.
- Debug-Rahmen und technische Feldnamen werden nicht angezeigt.
- Safe Areas und Bleed werden intern berücksichtigt.
- Eine technische Druckansicht bleibt getrennt vom normalen Nutzerflow.
- Die Vorschau ist nicht frei editierbar.

## Result

- Changed: Die Live-Vorschau ist als separate Komponente ausgelagert und rendert dieselben Daten wie die Druck- und Freigabeansicht.
- Changed: Ladezustand, Fehlerfall und mobile Vergrößerung sind im Vorschau-Container enthalten.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
