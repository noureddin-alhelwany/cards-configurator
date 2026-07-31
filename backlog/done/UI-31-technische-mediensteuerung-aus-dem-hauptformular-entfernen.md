---
id: UI-31
type: story
priority: must
status: done
depends_on: [UI-12, US-12, US-13, US-14]
title: "Technische Mediensteuerung aus dem Hauptformular entfernen"
---

# UI-31 – Technische Mediensteuerung aus dem Hauptformular entfernen

## User Story

Als Nutzer beziehungsweise Produktteam möchte ich diese Änderung, damit der neue produktorientierte Flow einfach, kontrolliert und verständlich bleibt.

## Acceptance Criteria

- [x] X-, Y- und Skalierungswerte werden im Hauptformular nicht angezeigt.
- [x] Nach Upload steht „Bild anpassen“ zur Verfügung.
- [x] Die Anpassung erfolgt in einem separaten Dialog.
- [x] Verschieben, Zoomen, Zurücksetzen und Übernehmen sind möglich.
- [x] Bestehende Transformationswerte und Backendfunktionen werden weiterverwendet.

## Result

Die Mediensteuerung ist aus dem Hauptformular herausgelöst und lebt jetzt in einem separaten Dialog. Das Hauptformular zeigt nur Upload, Status und die Einstiegsschaltfläche zum Anpassen.

## Verification

- `make test`
- `make build`
