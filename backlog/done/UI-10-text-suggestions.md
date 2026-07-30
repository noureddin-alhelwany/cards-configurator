---
id: UI-10
type: user-story
title: "Textvorschläge integrieren"
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

# UI-10 – Textvorschläge integrieren

## User Story

Als Nutzer möchte ich fertige Textvorschläge auswählen können, damit ich nicht selbst passende Formulierungen entwickeln muss.

## Beispiel für Google-Bewertungen

- Wie war dein Besuch bei uns?
- Deine Meinung bedeutet uns viel.
- Zufrieden mit unserem Service?
- Teile deine Erfahrung mit uns.

## Akzeptanzkriterien

- Textfelder können konfigurierbare Vorschläge besitzen.
- Ein Vorschlag kann mit einer Aktion übernommen werden.
- Der übernommene Text bleibt bearbeitbar.
- Vorschläge respektieren die erlaubte Textlänge.
- Die Komponente ist nicht an einen einzelnen Anwendungsfall gebunden.
- Die Struktur kann später um AI-Vorschläge erweitert werden.
- AI-Funktionen selbst sind nicht Bestandteil dieser Story.

## Result

- Changed: Textfelder bieten über die Mapping-Schicht konfigurierbare Vorschläge, die mit einem Klick übernommen werden können.
- Changed: Übernommene Vorschläge bleiben weiter bearbeitbar und respektieren die erlaubte Textlänge.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
