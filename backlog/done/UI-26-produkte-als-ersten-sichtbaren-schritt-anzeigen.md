---
id: UI-26
type: story
priority: must
status: done
depends_on: [US-02, UI-25]
title: "Produkte als ersten sichtbaren Schritt anzeigen"
---

# UI-26 – Produkte als ersten sichtbaren Schritt anzeigen

## User Story

Als Nutzer beziehungsweise Produktteam möchte ich diese Änderung, damit der neue produktorientierte Flow einfach, kontrolliert und verständlich bleibt.

## Acceptance Criteria

- [x] Der sichtbare Flow startet mit Produkt → Design → Inhalte → Prüfen.
- [x] Anwendungsfälle werden im Frontend nicht angezeigt.
- [x] Use Cases bleiben intern für Zuordnung, Filter, Empfehlungen und spätere AI-Logik erhalten.
- [x] Produktkarten zeigen verständlichen Namen, Nutzenbeschreibung, Vorschau und Auswahlstatus.
- [x] Nach Auswahl werden nur kompatible Templates geladen.

## Result

Der Wizard startet jetzt mit Produkt, zeigt nur die vier sichtbaren Schritte und hält Use Cases intern. Produkt- und Templatekarten nutzen beschreibende Metadaten, die Inhalte wurden an die neue Produkt-first-Führung angepasst und die zugehörigen Frontend-Tests sowie der Build laufen grün.

## Verification

- `make test`
- `make build`
