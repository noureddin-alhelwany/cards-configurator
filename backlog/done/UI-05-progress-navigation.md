---
id: UI-05
type: user-story
title: "Fortschrittsnavigation erstellen"
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

# UI-05 – Fortschrittsnavigation erstellen

## User Story

Als Nutzer möchte ich sehen, wo ich mich im Prozess befinde, damit der verbleibende Aufwand überschaubar ist.

## Akzeptanzkriterien

- Die Navigation zeigt höchstens vier nutzerverständliche Hauptschritte.
- Ein optionaler Produktschritt wird nur bei Bedarf ergänzt.
- Der aktuelle Schritt verwendet aria-current="step".
- Abgeschlossene Schritte sind semantisch als abgeschlossen markiert.
- Zukünftige Schritte sind deaktiviert.
- Die Navigation funktioniert mit Tastatur.
- Auf kleinen Bildschirmen kann sie kompakt dargestellt werden.
- Technische Backendzustände werden nicht angezeigt.
- Die Komponente ist unabhängig vom finalen visuellen Stil.

## Result

- Changed: Die Fortschrittsnavigation zeigt nutzerverständliche Schritte mit `aria-current="step"`, markiert abgeschlossene Schritte und deaktiviert zukünftige Schritte.
- Changed: Der Produktschritt bleibt optional und die Navigation funktioniert auf kleinen Bildschirmen kompakt.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
