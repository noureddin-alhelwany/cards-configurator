---
id: UI-28
type: story
priority: must
status: done
depends_on: [UI-27, US-18, US-19, US-20, US-21]
title: "Validierungsregeln vollständig an Templates binden"
---

# UI-28 – Validierungsregeln vollständig an Templates binden

## User Story

Als Nutzer beziehungsweise Produktteam möchte ich diese Änderung, damit der neue produktorientierte Flow einfach, kontrolliert und verständlich bleibt.

## Acceptance Criteria

- [x] Validierungs- und Qualitätsregeln werden aus dem Template geladen.
- [x] Gemeinsame Validatoren führen Pflichtfeld-, Längen-, URL-, Datei- und Bildregeln aus.
- [x] QR-Regeln und verständliche Meldungen können templatebezogen definiert werden.
- [x] Keine individuelle Programmlogik pro Template, solange deklarative Regeln ausreichen.
- [x] Technische Rohmeldungen werden nicht direkt ausgegeben.

## Result

Die Validierung arbeitet zentral über Template-Feldmetadaten, Produktgrenzen und gemeinsame Validatoren. Das Frontend übersetzt die resultierenden Issues in freundliche, feldbezogene Meldungen und zeigt keine technischen Rohtexte direkt an.

## Verification

- `make test`
- `make build`
