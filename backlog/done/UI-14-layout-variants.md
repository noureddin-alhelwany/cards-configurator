---
id: UI-14
type: user-story
title: "Layoutvarianten einfach auswählbar machen"
epic: "UI"
status: done
priority: should
depends_on:
  - UI-13
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T20:37:12Z
completed_at: 2026-07-30T20:37:12Z
---

# UI-14 – Layoutvarianten einfach auswählbar machen

## User Story

Als Nutzer möchte ich zwischen wenigen passenden Layoutvarianten wählen können, damit ich das Ergebnis beeinflussen kann, ohne das Design zu beschädigen.

## Beispiele

- Logo im Fokus
- Foto im Fokus
- Text im Fokus

## Akzeptanzkriterien

- Varianten werden mit verständlichen Namen angezeigt.
- Jede Variante besitzt eine kleine visuelle Vorschau.
- Technische Variantenschlüssel werden nicht angezeigt.
- Es werden nur Varianten angeboten, die zum Template passen.
- Der Wechsel aktualisiert die Live-Vorschau sofort.
- Die Anzahl der Varianten bleibt bewusst begrenzt.
- Der Nutzer kann keine Elemente frei platzieren.
- Eine Standardvariante ist vorausgewählt.

## Result

- Changed: Layoutvarianten werden mit verständlichen Namen und kleinen visuellen Previews angezeigt.
- Changed: Nur aktive Varianten eines Templates sind auswählbar und die Standardvariante ist vorausgewählt.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
