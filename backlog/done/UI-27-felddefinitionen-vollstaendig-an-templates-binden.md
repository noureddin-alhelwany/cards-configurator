---
id: UI-27
type: story
priority: must
status: done
depends_on: [US-06, UI-25]
title: "Felddefinitionen vollständig an Templates binden"
---

# UI-27 – Felddefinitionen vollständig an Templates binden

## User Story

Als Nutzer beziehungsweise Produktteam möchte ich diese Änderung, damit der neue produktorientierte Flow einfach, kontrolliert und verständlich bleibt.

## Acceptance Criteria

- [x] Das Template definiert Felder, Reihenfolge, Gruppierung, Labels, Hilfetexte und Standardwerte.
- [x] Das Template definiert Pflichtstatus, Textvorschläge, QR-Texte und Uploadregeln.
- [x] Das Frontend erfindet keine fachlichen Labels.
- [x] Unterschiedliche Templates dürfen unterschiedliche Felder besitzen.
- [x] Das Frontend rendert nur standardisierte technische Feldtypen.

## Result

Die Feldmetadaten sind jetzt vollständig in den Template-Definitionen verankert und werden in Frontend und Backend aus denselben Schemafeldern gelesen. Labels, Hilfetexte, Platzhalter, Vorschläge und Defaultwerte kommen aus den registrierten Templates; die UI ist damit nicht mehr an feste Fachtexte gekoppelt.

## Verification

- `make test`
- `make build`
