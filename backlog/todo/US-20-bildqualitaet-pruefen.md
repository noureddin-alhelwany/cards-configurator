---
    id: US-20
    type: user-story
    title: "Bildqualität prüfen"
    epic: "7 — Qualitätsprüfung"
    status: todo
    priority: must
    depends_on: [US-10, US-16]
    verification: mixed
    context_docs: [docs/QUALITY_STRATEGY.md, docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at:
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

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
