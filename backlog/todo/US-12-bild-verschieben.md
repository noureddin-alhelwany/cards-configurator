---
    id: US-12
    type: user-story
    title: "Bild verschieben"
    epic: "5 — Kontrollierter Editor"
    status: todo
    priority: must
    depends_on: [US-10, US-16]
    verification: frontend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at:
    ---

    # US-12 — Bild verschieben

    ## User story

    > Als interner Nutzer möchte ich das Bild innerhalb des vorgesehenen Ausschnitts verschieben, damit das Motiv richtig positioniert ist.

    ## Acceptance criteria

- [ ] Das Bild kann nur innerhalb seines Bildrahmens verschoben werden.
- [ ] Leere Flächen dürfen nicht sichtbar werden.
- [ ] Die Position wird relativ gespeichert.
- [ ] Die Änderung aktualisiert die Vorschau sofort.

## Architecture-specific implementation notes

- Pointer Events und normale DOM-/SVG-Elemente verwenden; kein Fabric.js oder Konva.js.
- Positionen normalisiert und viewport-unabhängig speichern.

## Source-derived technical tasks

- Crop-Editor implementieren
- Bewegungsgrenzen berechnen
- relative Koordinaten speichern
- Layout-State aktualisieren

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
