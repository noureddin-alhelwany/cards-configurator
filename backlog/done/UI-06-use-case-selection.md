---
id: UI-06
type: user-story
title: "Anwendungsfall auswählen"
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

# UI-06 – Anwendungsfall auswählen

## User Story

Als Nutzer möchte ich auswählen, was ich erstellen möchte, damit mir nur passende Karten und Designs angeboten werden.

## Beispiel-Anwendungsfälle

### Google-Bewertungen

Kunden direkt zu deiner Google-Bewertung führen.

### Terminbuchung

Kunden über einen QR-Code zu deiner Terminbuchung führen.

### Allgemeine QR-Karte

Kunden zu deiner Website, Speisekarte oder einer anderen Seite führen.

## Akzeptanzkriterien

Jede Auswahl enthält:

- verständlichen Namen
- kurze Nutzenbeschreibung
- Vorschaubereich
- Auswahlstatus

Zusätzlich:

- Interne Use-Case-IDs werden nicht angezeigt.
- Die Auswahl ist als semantische Einzelauswahl umgesetzt.
- Die vollständige Auswahl funktioniert mit Tastatur.
- Nicht verfügbare Angebote werden ausgeblendet oder als „Demnächst“ markiert.
- Nach der Auswahl werden kompatible Produkte und Templates geladen.
- Bei nur einem verfügbaren Anwendungsfall darf dieser automatisch gewählt werden.

## Result

- Changed: Die Auswahl der Anwendungsfälle ist als semantische Einzelauswahl mit verständlichen Namen, Beschreibung und Vorschaubildern umgesetzt.
- Changed: Nicht aktive Angebote werden ausgeblendet und der erste verfügbare Use Case kann automatisch als Startpunkt gesetzt werden.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
