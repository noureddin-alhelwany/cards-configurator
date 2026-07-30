---
id: UI-11
type: user-story
title: "Logo- und Bildupload erstellen"
epic: "UI"
status: done
priority: should
depends_on:
  - UI-09
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T20:20:40Z
completed_at: 2026-07-30T20:20:40Z
---

# UI-11 – Logo- und Bildupload erstellen

## User Story

Als Nutzer möchte ich Logo und Bilder einfach hochladen können, damit die Karte zu meinem Unternehmen passt.

## Akzeptanzkriterien

- Logo und Foto verwenden getrennte Uploadfelder.
- Unterstützte Dateitypen werden verständlich beschrieben.
- Nach dem Upload erscheint eine Vorschau.
- Eine Datei kann ersetzt oder entfernt werden.
- Uploadstatus und Fehler werden sichtbar dargestellt.
- Ungeeignete Dateien führen zu verständlichen Meldungen.
- Technische Dateiinformationen werden nur bei Bedarf angezeigt.
- Drag-and-drop kann unterstützt werden.
- Ein normaler Datei-Button bleibt immer verfügbar.
- Die Bedienung funktioniert mit Maus, Touch und Tastatur.
- Technische X- und Y-Werte werden nicht angezeigt.

## Result

- Changed: Logo und Foto werden über getrennte Uploadfelder verwaltet, inklusive verständlicher Hinweise zu Dateitypen und Fehlern.
- Changed: Nach dem Upload erscheinen Vorschau, Ersetzen- und Entfernen-Aktionen; technische Details bleiben in einem aufklappbaren Bereich.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
