---
id: US-01
type: user-story
title: "Kategorie auswählen"
epic: "1 — Kategorie und Produkt"
status: done
priority: must
depends_on: [TECH-02]
verification: frontend
context_docs: [docs/MVP_SCOPE.md, docs/DOMAIN_MODEL.md]
started_at: 2026-07-30
completed_at: 2026-07-30
---

# US-01 — Kategorie auswählen

## User story

> Als interner Nutzer möchte ich die Kategorie auswählen, damit mir passende Produkte und Designs angezeigt werden.

## Acceptance criteria

- [x] Es werden definierte Kategorien angezeigt.
- [x] Jede Kategorie besitzt Name, Beschreibung und Vorschaubild.
- [x] Nach der Auswahl werden nur passende Produkte und Templates angezeigt.
- [x] Die Auswahl kann vor der Finalisierung geändert werden.

## Architecture-specific implementation notes

- `Category` ist eine versionierte Pydantic-Konfiguration aus `config/categories/`, keine SQL-Tabelle.
- Die Auswahl wird im Draft-Layout-State gespeichert.

## Source-derived technical tasks

- Datenmodell `Category` erstellen
- Kategorien als strukturierte Konfiguration anlegen
- Auswahlseite implementieren
- Auswahl im Konfigurationsstatus speichern

## Result

- Changed: added a registry-driven root selection page that shows categories with previews and filters matching products and templates when a category is selected.
- Decisions: keep the selection state local in the UI for this slice, while the backend continues to serve the typed registries and preview assets.
- Verification: `make lint`, `make typecheck`, `make test`, `make build`.
- Remaining risks: draft persistence is not implemented yet, so the current selection only lives in the frontend state.
