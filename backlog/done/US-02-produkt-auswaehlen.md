---
id: US-02
type: user-story
title: "Produkt auswählen"
epic: "1 — Produkt und Anwendungsfall"
status: done
priority: must
depends_on: [TECH-02, US-01]
verification: mixed
context_docs: [docs/MVP_SCOPE.md, docs/DOMAIN_MODEL.md]
started_at: 2026-07-30
completed_at: 2026-07-30
---

# US-02 — Produkt auswählen

## User story

> Als interner Nutzer möchte ich ein Produkt auswählen, damit Format und Druckregeln festgelegt werden.

## Acceptance criteria

- [x] Produktname, Format und Vorschau werden angezeigt.
- [x] Nur aktive Produkte werden angeboten.
- [x] Das Produkt definiert Größe, Beschnitt und Auflösungsgrenzen.
- [x] Ein Produkt kann mehreren Anwendungsfällen zugeordnet werden.

## Architecture-specific implementation notes

- `Product` ist eine versionierte Konfigurationsdatei, keine SQL-Tabelle.
- Der erste vertikale Durchstich darf genau ein Produkt enthalten.

## Source-derived technical tasks

- Datenmodell `Product` erstellen
- Produktkonfiguration definieren
- Produktübersicht implementieren
- Produktregeln in Layout-State übernehmen

## Result

- Changed: added selectable product cards, product detail metadata, and active-product filtering to the registry-driven selection page.
- Decisions: keep the product choice local for this slice and derive multi-use-case support from the existing template registry links.
- Verification: `make lint`, `make typecheck`, `make test`, `make build`.
- Remaining risks: product selection is still not persisted in a draft entity yet.
