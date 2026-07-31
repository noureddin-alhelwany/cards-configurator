---
id: US-27
type: user-story
title: "Auftrag öffnen"
epic: "10 — Auftragsverwaltung"
status: done
priority: must
depends_on: [US-23, US-24]
verification: e2e
context_docs: [docs/DOMAIN_MODEL.md, docs/TEMPLATE_AND_RENDERING.md]
started_at: 2026-07-30T23:31:10Z
completed_at: 2026-07-30T23:37:33Z
---

# US-27 — Auftrag öffnen

## User story

> Als interner Nutzer möchte ich einen Auftrag öffnen, damit ich dessen Inhalte und Produktionsdateien sehen kann.

## Acceptance criteria

- [x] alle Kundeneingaben
- [x] verwendetes Template
- [x] Layoutvariante
- [x] finale Vorschau
- [x] Produkt-Mockup
- [x] hochgeladene Assets
- [x] Produktions-PDF
- [x] Freigabezeitpunkt

## Architecture-specific implementation notes

- Detailansicht zeigt ausschließlich gespeicherte Snapshots und finale Artefakte.
- Ein alter Auftrag darf sich durch spätere Template-Änderungen nicht verändern.

## Source-derived technical tasks

- Auftragsdetailseite entwickeln
- Layout-Snapshot anzeigen
- Assets zugänglich machen
- PDF öffnen oder herunterladen

## Result

- Changed: Die Auftragsdetailseite zeigt jetzt gespeicherte Snapshots für Kunde, Produkt, Template, Variante, Freigabezeitpunkt, Textwerte und Asset-Zuordnungen.
- Changed: Finale Vorschau, Produkt-Mockup und Produktions-PDF sind über eigene Links und Bildbereiche aufrufbar.
- Changed: Die hochgeladenen Assets werden auf der Detailseite als gespeicherte Asset-Karten mit Metadaten dargestellt.
- Decisions: Das Mockup wird über denselben gespeicherten Artefaktpfad wie die Vorschau ausgeliefert; die Detailansicht rendert nur gespeicherte Snapshots und finale Dateien.
- Verification: `backend/.venv/bin/pytest backend/tests/test_orders.py`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend test:e2e`
- Remaining risks: Die Detailansicht zeigt Asset-Metadaten aus `/api/assets/:id`; wenn ein Asset dort nicht mehr lesbar ist, fällt die Asset-Karte auf einen Platzhalter zurück.
