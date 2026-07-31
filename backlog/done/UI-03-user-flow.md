---
id: UI-03
type: user-story
title: "Nutzerorientierten Prozess definieren"
epic: "UI"
status: done
priority: must
depends_on:
  - UI-02
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T18:36:42Z
completed_at: 2026-07-30T18:53:57Z
---

# UI-03 – Nutzerorientierten Prozess definieren

## User Story

Als Nutzer möchte ich nur verständliche und notwendige Schritte sehen, damit sich die Erstellung einfach anfühlt.

## Sichtbare Schritte

1. Auswahl
2. Design
3. Inhalte
4. Prüfen

Ein zusätzlicher Produktschritt wird nur eingeblendet, wenn mehrere sinnvolle Produkte verfügbar sind.

## Akzeptanzkriterien

- Backendbegriffe werden nicht als sichtbare Schritte verwendet.
- Der UI-Flow ist nicht fest an die Backendstruktur gekoppelt.
- Ein Produkt wird automatisch ausgewählt, wenn nur ein kompatibles Produkt existiert.
- Ein eigener Produktschritt erscheint nur bei mehreren echten Auswahlmöglichkeiten.
- Der aktuelle Schritt ist eindeutig bestimmbar.
- Abgeschlossene Schritte können erneut geöffnet werden.
- Noch nicht verfügbare Schritte können nicht aufgerufen werden.
- Eingaben bleiben beim Zurückgehen erhalten.
- Der Flow funktioniert für unterschiedliche Use Cases, Produkte und Templates.
- Alle benötigten technischen IDs werden intern weiterhin gespeichert.

## Result

- Changed: Der sichtbare Flow nutzt jetzt die nutzerorientierten Schritte Auswahl, optional Produkt, Design, Inhalte und Prüfen statt Backendbegriffe.
- Changed: Der Produktschritt erscheint nur bei mehreren sinnvollen Produkten und die Navigation bleibt beim Zurückgehen konsistent.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
