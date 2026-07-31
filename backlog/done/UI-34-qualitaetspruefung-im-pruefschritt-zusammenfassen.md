---
id: UI-34
type: story
priority: must
status: done
depends_on: [UI-16, UI-17]
title: "Qualitätsprüfung im Prüfschritt zusammenfassen"
---

# UI-34 – Qualitätsprüfung im Prüfschritt zusammenfassen

## User Story

Als Nutzer beziehungsweise Produktteam möchte ich diese Änderung, damit der neue produktorientierte Flow einfach, kontrolliert und verständlich bleibt.

## Acceptance Criteria

- [x] Der Prüfschritt zeigt verständliche erfolgreiche Qualitätsprüfungen.
- [x] Pflichtfelder, QR-Code, Bildqualität und Druckbereich können dargestellt werden.
- [x] Technische Produktnamen wie „A6 Card with Bleed“ werden ersetzt.
- [x] Es gibt nur eine eindeutige Zurück-Aktion.
- [x] „Design freigeben“ ist die klare Hauptaktion.

## Result

Der Prüfschritt fasst die Qualitätsprüfung jetzt in vier verständliche Prüfpunkte zusammen und nutzt den Produktnamen aus der Registry. Es gibt nur eine zurückführende Aktion und eine klare Hauptaktion für die Freigabe.

## Verification

- `make test`
- `make build`
