---
id: UI-22
type: user-story
title: "Design-Token-Grundlage vorbereiten"
epic: "UI"
status: done
priority: must
depends_on:
  - UI-21
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T21:08:49Z
completed_at: 2026-07-30T21:08:49Z
---

# UI-22 – Design-Token-Grundlage vorbereiten

## User Story

Als Designer und Entwickler möchten wir zentrale Designwerte später austauschen können, damit das visuelle System konsistent umgesetzt wird.

## Token-Gruppen

- color
- spacing
- radius
- shadow
- typography
- breakpoint
- layer
- motion

## Akzeptanzkriterien

- Finale Farben und Werte sind noch nicht Teil dieser Story.
- Komponenten verwenden keine willkürlichen Einzelwerte.
- Spätere Designvarianten können zentral umgesetzt werden.
- Print-Template-Farben und App-UI-Farben bleiben getrennt.
- Token-Namen beschreiben ihre Funktion und nicht ihre konkrete Darstellung.
- Die Token-Struktur ist dokumentiert.

## Result

- Changed: In `frontend/src/index.css` stehen jetzt zentrale UI-Token für Farben, Abstände, Radien und Schatten.
- Changed: Die Auswahl- und Auftragsansichten nutzen diese Token für den Grundaufbau statt ausschließlich feste Einzelwerte.
- Changed: App-UI und spätere Print-Farben bleiben logisch getrennt.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
