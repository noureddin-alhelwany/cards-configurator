---
id: US-01
type: user-story
title: "Anwendungsfall auswählen"
epic: "1 — Produkt und Anwendungsfall"
status: done
priority: must
depends_on: [TECH-02]
verification: frontend
context_docs: [docs/MVP_SCOPE.md, docs/DOMAIN_MODEL.md]
started_at: 2026-07-30
completed_at: 2026-07-30
---

# US-01 — Anwendungsfall auswählen

## User story

> Als interner Nutzer möchte ich den Einsatzzweck auswählen, damit mir passende Produkte und Designs angezeigt werden.

## Acceptance criteria

- [x] Es werden definierte Anwendungsfälle angezeigt.
- [x] Jeder Anwendungsfall besitzt Name, Beschreibung und Vorschaubild.
- [x] Nach der Auswahl werden nur passende Produkte und Templates angezeigt.
- [x] Die Auswahl kann vor der Finalisierung geändert werden.

## Architecture-specific implementation notes

- `UseCase` ist eine versionierte Pydantic-Konfiguration aus `config/use-cases/`, keine SQL-Tabelle.
- Die Auswahl wird im Draft-Layout-State gespeichert.

## Source-derived technical tasks

- Datenmodell `UseCase` erstellen
- Anwendungsfälle als strukturierte Konfiguration anlegen
- Auswahlseite implementieren
- Auswahl im Konfigurationsstatus speichern

## Result

- Changed: added a registry-driven root selection page that shows use cases with previews and filters matching products and templates when a use case is selected.
- Decisions: keep the selection state local in the UI for this slice, while the backend continues to serve the typed registries and preview assets.
- Verification: `make lint`, `make typecheck`, `make test`, `make build`.
- Remaining risks: draft persistence is not implemented yet, so the current selection only lives in the frontend state.
