---
id: US-26
type: user-story
title: "Aufträge anzeigen"
epic: "10 — Auftragsverwaltung"
status: done
priority: must
depends_on: [US-23]
verification: mixed
context_docs: [docs/DOMAIN_MODEL.md]
started_at: 2026-07-30T18:23:12Z
completed_at: 2026-07-30T18:27:16Z
---

# US-26 — Aufträge anzeigen

## User story

> Als interner Nutzer möchte ich alle erstellten Aufträge sehen, damit ich sie später öffnen kann.

## Acceptance criteria

- [x] Auftragsnummer
- [x] Datum
- [x] Kunde oder Firmenname
- [x] Produkt
- [x] Template
- [x] Vorschaubild

## Architecture-specific implementation notes

- Auftragsliste liest nur finale Orders, keine Drafts.

## Source-derived technical tasks

- Auftragsliste implementieren
- Sortierung nach Datum
- Vorschaubilder laden
- Detailverlinkung implementieren

## Result

- Changed: Auftragskacheln in der bestehenden Wizard-Freigabe zeigen jetzt Vorschaubild, Auftragsnummer, Datum, Kundenname, Produkt und Template.
- Decisions: Der Kundenname wird aus dem Draft-Feld `businessName` in `display_name` übernommen; falls kein Name vorhanden ist, zeigt die UI einen verständlichen Platzhalter.
- Verification: `backend/.venv/bin/pytest backend/tests`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
- Remaining risks: Vorschaubilder hängen weiterhin von erfolgreich erzeugten Order-Previews ab.
