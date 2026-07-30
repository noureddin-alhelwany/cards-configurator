---
    id: US-12
    type: user-story
    title: "Bild verschieben"
    epic: "5 — Kontrollierter Editor"
    status: done
    priority: must
    depends_on: [US-10, US-16]
    verification: frontend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at: 2026-07-30
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

    - Changed: Bild-Elemente können nun per normalisierten Element-Adjustments verschoben werden, die Position wird serverseitig gespeichert und die Live-Vorschau reagiert sofort darauf.
    - Decisions: Die Verschiebung wird relativ zum definierten Bewegungsrahmen gespeichert, damit sie unabhängig von der Browsergröße bleibt.
    - Verification: `backend/.venv/bin/pytest backend/tests/test_drafts.py backend/tests/test_assets.py backend/tests/test_rendering_proof.py -q`, `make lint`, `make typecheck`, `make test`, `make build`.
    - Remaining risks: Ein konventioneller Drag-and-Drop-Editor ist noch nicht nötig; die Regler decken den kontrollierten MVP-Workflow ab.
