---
id: TPL-01
type: story
priority: must
status: done
depends_on: [TECH-TPL-01]
title: "Produkt und Dokumentformat auswählen"
---

# TPL-01 – Produkt und Dokumentformat auswählen

## Acceptance Criteria

- [x] Produkt kommt aus der bestehenden Registry.
- [x] Format, Beschnitt, Safe Area und Auflösung werden geladen.
- [x] Produktwechsel warnt vor Datenverlust.

## Result

- Produktkarten zeigen jetzt Format, Beschnitt, Auflösung und einen Safe-Area-Hinweis aus den passenden Designs.
- Die bestehende Produktwechsel-Warnung bleibt erhalten und wird weiterhin vor dem Zurücksetzen der aktuellen Auswahl gezeigt.
- Verifikation: `frontend/node_modules/.bin/vitest run src/selection/selectionCards.test.tsx`, `frontend/node_modules/.bin/tsc -p tsconfig.json --noEmit`.
