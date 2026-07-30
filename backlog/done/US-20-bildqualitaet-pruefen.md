---
    id: US-20
    type: user-story
    title: "Bildqualität prüfen"
    epic: "7 — Qualitätsprüfung"
    status: done
    priority: must
    depends_on: [US-10, US-16]
    verification: mixed
    context_docs: [docs/QUALITY_STRATEGY.md, docs/TEMPLATE_AND_RENDERING.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-20 — Bildqualität prüfen

    ## User story

    > Als interner Nutzer möchte ich die effektive Bildauflösung sehen, damit ich schlechte Druckqualität erkenne.

    ## Acceptance criteria

- [ ] Die effektive DPI wird anhand der Druckgröße berechnet.
- [ ] Grenzwerte werden pro Produkt definiert.
- [ ] Es gibt die Stufen ausreichend, grenzwertig und ungeeignet.
- [ ] Ungeeignete Bilder blockieren die Finalisierung.
- [ ] Grenzwertige Bilder erzeugen eine Warnung.

## Architecture-specific implementation notes

- DPI aus Originalpixeln, sichtbarem Crop und physischer Druckgröße berechnen.
- Grenzwerte gehören zum Produkt-Snapshot.

## Source-derived technical tasks

- DPI-Berechnung implementieren
- Produktgrenzwerte definieren
- Warnkomponente entwickeln
- Finalisierungsregeln anwenden

    ## Result

    - Changed: Added image-quality tier labels in the selection UI, plus backend validation for warning and blocking DPI thresholds based on product snapshots and uploaded image metadata.
    - Decisions: Kept the DPI rule on the shared validation path so unsuitable images block release while borderline images only warn.
    - Verification: `backend/.venv/bin/pytest backend/tests/test_quality.py backend/tests/test_assets.py backend/tests/test_drafts.py -q`, `cd frontend && COREPACK_HOME=/tmp/corepack corepack pnpm vitest run src/App.test.tsx`, `cd frontend && COREPACK_HOME=/tmp/corepack corepack pnpm typecheck`, `make lint`, `make test`, `make build`
    - Remaining risks: The visible-crop calculation is intentionally conservative; edge cases with unusual crops may still need manual review.
