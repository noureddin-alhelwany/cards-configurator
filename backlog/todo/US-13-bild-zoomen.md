---
    id: US-13
    type: user-story
    title: "Bild zoomen"
    epic: "5 — Kontrollierter Editor"
    status: todo
    priority: must
    depends_on: [US-10, US-16, US-20]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
    started_at:
    completed_at:
    ---

    # US-13 — Bild zoomen

    ## User story

    > Als interner Nutzer möchte ich ein Bild vergrößern oder verkleinern, damit der gewünschte Ausschnitt sichtbar ist.

    ## Acceptance criteria

- [ ] Das Template definiert minimale und maximale Skalierung.
- [ ] Das Bild darf den Rahmen nicht unterschreiten.
- [ ] Die effektive Auflösung wird nach Skalierung neu berechnet.
- [ ] Warnungen werden direkt aktualisiert.

## Architecture-specific implementation notes

- Zoom als dimensionsloser Faktor speichern.
- DPI nach jeder Änderung aus Druckgröße und sichtbarem Bildausschnitt neu berechnen.

## Source-derived technical tasks

- Zoom-Steuerung implementieren
- Min-/Max-Werte aus Template laden
- DPI nach Skalierung berechnen
- Vorschau aktualisieren

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
