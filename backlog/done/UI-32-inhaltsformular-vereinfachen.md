---
id: UI-32
type: story
priority: should
status: done
depends_on: [UI-09, UI-11]
title: "Inhaltsformular vereinfachen"
---

# UI-32 – Inhaltsformular vereinfachen

## User Story

Als Nutzer beziehungsweise Produktteam möchte ich diese Änderung, damit der neue produktorientierte Flow einfach, kontrolliert und verständlich bleibt.

## Acceptance Criteria

- [x] Felder werden in wenige Gruppen wie Texte, Bilder und Link gegliedert.
- [x] Unnötig verschachtelte Cards werden reduziert.
- [x] Unternehmensname wird als einzeiliges Feld dargestellt.
- [x] Mehrzeilige Felder erscheinen nur bei Bedarf.
- [x] Leere Uploadzustände bleiben kompakt.
- [x] „Inhalte zurücksetzen“ ist keine prominente Aktion.

## Result

Das Inhaltsformular nutzt jetzt wenige klare Gruppen und reduziert die Verschachtelung auf die eigentlichen Eingaben. Einzeilige und mehrzeilige Felder werden passend zur Definition gerendert, leere Uploadzustände bleiben kompakt.

## Verification

- `make test`
- `make build`
