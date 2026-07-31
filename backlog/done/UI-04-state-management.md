---
id: UI-04
type: user-story
title: "Zentralen Konfigurationszustand aufbauen"
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

# UI-04 – Zentralen Konfigurationszustand aufbauen

## User Story

Als Nutzer möchte ich meine Auswahl und Eingaben während des gesamten Prozesses behalten, damit ich jederzeit zurückgehen und etwas ändern kann.

## Akzeptanzkriterien

Der zentrale Zustand enthält mindestens:

- selectedUseCase
- selectedProduct
- selectedTemplate
- selectedVariant
- fieldValues
- uploadedAssets
- mediaTransforms
- validationState
- previewState
- approvalState

Zusätzlich:

- Alle Schritte greifen auf denselben Konfigurationszustand zu.
- Änderungen aktualisieren abhängige Daten kontrolliert.
- Ein Templatewechsel setzt nur inkompatible Werte zurück.
- Ein Produktwechsel informiert vor dem Zurücksetzen inkompatibler Daten.
- Ein Reload kann den Zustand wiederherstellen, sofern dies im MVP vorgesehen ist.
- Backenddaten und UI-Zustand bleiben klar getrennt.
- UI-Texte werden nicht als Geschäftslogik im Zustand gespeichert.

## Result

- Changed: Der Konfigurationszustand wird zentral geführt und enthält die Auswahl-, Layout-, Validierungs-, Vorschau- und Freigabedaten, die die Schritte gemeinsam nutzen.
- Changed: Abhängige Werte werden kontrolliert zurückgesetzt, und ein Produktwechsel zeigt jetzt vor dem Verwerfen inkompatibler Werte eine Bestätigung an.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
