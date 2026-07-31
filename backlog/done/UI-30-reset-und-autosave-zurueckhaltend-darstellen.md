---
id: UI-30
type: story
priority: should
status: done
depends_on: [US-28]
title: "Reset und Autosave zurückhaltend darstellen"
---

# UI-30 – Reset und Autosave zurückhaltend darstellen

## User Story

Als Nutzer beziehungsweise Produktteam möchte ich diese Änderung, damit der neue produktorientierte Flow einfach, kontrolliert und verständlich bleibt.

## Acceptance Criteria

- [x] Die große Reset-Box wird entfernt.
- [x] Der Speicherstatus wird kompakt als „Gespeichert“ dargestellt.
- [x] Die genaue Speicherzeit wird nicht dauerhaft prominent angezeigt.
- [x] Reset befindet sich in einem Nebenmenü und erfordert eine Bestätigung.
- [x] Reset ist nie visuell gleichwertig mit der Hauptaktion.

## Result

Die Kopfzeile zeigt nur noch den kompakten Speicherstatus, und der Reset ist in ein Nebenmenü mit Bestätigung ausgelagert. Die vorherige große Reset-Box existiert im aktuellen UI nicht mehr.

## Verification

- `make test`
- `make build`
