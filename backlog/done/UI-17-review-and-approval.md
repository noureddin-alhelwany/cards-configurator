---
id: UI-17
type: user-story
title: "Prüfen-und-Freigeben-Schritt erstellen"
epic: "UI"
status: done
priority: must
depends_on:
  - UI-16
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T20:37:12Z
completed_at: 2026-07-30T20:37:12Z
---

# UI-17 – Prüfen-und-Freigeben-Schritt erstellen

## User Story

Als Nutzer möchte ich mein fertiges Design in einer übersichtlichen Abschlussansicht prüfen, damit ich es sicher freigeben kann.

## Akzeptanzkriterien

Der Abschluss zeigt:

- große Produktvorschau
- gewähltes Produkt
- gewähltes Design
- eingegebene Inhalte
- Ergebnis der Qualitätsprüfung
- Möglichkeit zur Bearbeitung zurückzugehen
- eindeutige Freigabeaktion

Zusätzlich:

- Es gibt keine vier manuellen technischen Prüfcheckboxen.
- Der Nutzer bestätigt lediglich, dass er die Vorschau geprüft hat.
- Die automatische Qualitätsprüfung muss erfolgreich sein.
- Fehler führen direkt zurück zum passenden Bereich.
- Die Hauptaktion lautet zunächst „Design freigeben“ und danach „Auftrag erstellen“.
- Alte Testaufträge werden nicht angezeigt.
- Interne Auftrags- oder Template-IDs werden nicht unnötig dargestellt.

## Result

- Changed: Der Abschluss wurde auf eine kompakte Prüfen-/Freigeben-Ansicht reduziert.
- Changed: Statt vier technischer Checkboxes gibt es nur noch die Bestätigung, dass die Vorschau geprüft wurde; danach wechselt die Hauptaktion auf die Auftragserstellung.
- Changed: Alte Testaufträge sind aus dem Abschluss entfernt, und die Qualitäts-/Freigabehinweise bleiben verständlich.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
