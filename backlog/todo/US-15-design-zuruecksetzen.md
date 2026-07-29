---
    id: US-15
    type: user-story
    title: "Design zurücksetzen"
    epic: "5 — Kontrollierter Editor"
    status: todo
    priority: should
    depends_on: [US-12, US-13, US-14]
    verification: frontend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at:
    ---

    # US-15 — Design zurücksetzen

    ## User story

    > Als interner Nutzer möchte ich Änderungen zurücksetzen, damit ich zur empfohlenen Ausgangsposition zurückkehren kann.

    ## Acceptance criteria

- [ ] Einzelne Bilder und Logos können zurückgesetzt werden.
- [ ] Optional kann die gesamte Seite zurückgesetzt werden.
- [ ] Texte und Uploads bleiben bei einem Layout-Reset erhalten.
- [ ] Eine vollständige Undo-Historie ist nicht erforderlich.

## Architecture-specific implementation notes

- Kein Undo-/Redo-System bauen.
- Reset verwendet die Defaults der gewählten Variante.

## Source-derived technical tasks

- Default-Transformationswerte speichern
- Reset pro Element implementieren
- Reset für Layoutvariante implementieren

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
