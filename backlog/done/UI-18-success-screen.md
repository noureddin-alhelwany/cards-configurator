---
id: UI-18
type: user-story
title: "Erfolgsansicht nach Auftragserstellung erstellen"
epic: "UI"
status: done
priority: must
depends_on:
  - US-23
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T21:08:49Z
completed_at: 2026-07-30T21:08:49Z
---

# UI-18 – Erfolgsansicht nach Auftragserstellung erstellen

## User Story

Als Nutzer möchte ich nach der Auftragserstellung eine klare Bestätigung erhalten, damit ich weiß, dass alles funktioniert hat.

## Akzeptanzkriterien

Die Erfolgsansicht enthält:

- Bestätigung der Auftragserstellung
- verständliche Auftragsnummer
- kleine Vorschau
- Datum
- Produktname
- nächsten Schritt
- Möglichkeit, den Auftrag erneut zu öffnen

Nicht dargestellt werden:

- interne Produkt-Slugs
- technische Template-Versionen
- Debug-Daten
- Liste alter Testaufträge

## Result

- Changed: Die Auftragsseite zeigt jetzt eine klare Erfolgsansicht mit Auftragsnummer, Produktname, Datum, Vorschau und nächstem Schritt.
- Changed: Technische IDs und Template-Versionen werden im Hauptbildschirm nicht mehr angezeigt.
- Changed: Die Erfolgsansicht bietet direkte Aktionen zur Produktionsansicht und zum erneuten Öffnen des Auftrags.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
