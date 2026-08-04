---
id: UI-21
type: user-story
title: "Komponentenarchitektur definieren"
epic: "UI"
status: done
priority: must
depends_on:
  - UI-20
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T21:08:49Z
completed_at: 2026-07-30T21:08:49Z
---

# UI-21 – Komponentenarchitektur definieren

## User Story

Als Entwickler möchte ich wiederverwendbare UI-Komponenten mit stabilen Schnittstellen erhalten, damit das finale Design später ohne erneuten HTML-Umbau umgesetzt werden kann.

## Vorgesehene Komponenten

- AppShell
- StepNavigation
- StepLayout
- SelectionGrid
- SelectionCard
- ProductCard
- TemplateCard
- FormSection
- TextField
- TextSuggestionList
- FileUpload
- ImageEditor
- VariantSelector
- LivePreview
- ValidationMessage
- QualityCheck
- ReviewSummary
- ActionBar
- ConfirmationDialog
- EmptyState
- ErrorState
- LoadingState

## Akzeptanzkriterien

- Komponenten enthalten keine fest verdrahtete finale Optik.
- Klassen und Attribute werden nach Funktion statt Aussehen benannt.
- Komponenten unterstützen klar definierte Zustände.
- Komponenten sind nicht an eine einzelne Kategorie gekoppelt.
- Varianten können später über Design-Tokens gestaltet werden.
- Die Komponentenstruktur wird dokumentiert.
- Das HTML muss nach dem späteren UI-Design nicht neu aufgebaut werden.

## Result

- Changed: Gemeinsame UI-Bausteine wurden als neutrale Komponenten und Hilfsfunktionen getrennt, statt Logik und Bildschirmzustand direkt in den Seiten zu mischen.
- Changed: Die Architektur ist in `frontend/src/ui/ARCHITECTURE.md` dokumentiert.
- Changed: Status- und Label-Hilfen sind jetzt wiederverwendbar und nicht an einen einzelnen Flow gebunden.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
