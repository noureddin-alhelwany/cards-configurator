---
id: UI-29
type: story
priority: should
status: done
depends_on: [UI-20]
title: "Prozesskopf und Schrittanzeige reduzieren"
---

# UI-29 – Prozesskopf und Schrittanzeige reduzieren

## User Story

Als Nutzer beziehungsweise Produktteam möchte ich diese Änderung, damit der neue produktorientierte Flow einfach, kontrolliert und verständlich bleibt.

## Acceptance Criteria

- [x] Die doppelte Darstellung aus Schrittbalken und Fortschrittskarten wird entfernt.
- [x] Es bleibt eine eindeutige Fortschrittsnavigation.
- [x] Allgemeine Prozesseinleitungen werden nicht auf jedem Schritt wiederholt.
- [x] Jeder Schritt besitzt nur eine klare Hauptüberschrift.
- [x] Mobile darf kompakt „Schritt X von 4“ anzeigen.

## Result

Der alte, ungenutzte `wizard-trail`-Block wurde entfernt, und die kompakte Schrittzeile erscheint nur noch auf kleineren Bildschirmen. Auf dem Hauptlayout bleibt damit nur die eindeutige Navigationsleiste als Fortschrittsanzeige.

## Verification

- `make test`
- `make build`
