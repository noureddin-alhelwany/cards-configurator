---
    id: US-14
    type: user-story
    title: "Logo anpassen"
    epic: "5 — Kontrollierter Editor"
    status: todo
    priority: must
    depends_on: [US-09, US-16]
    verification: frontend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at:
    ---

    # US-14 — Logo anpassen

    ## User story

    > Als interner Nutzer möchte ich das Logo innerhalb einer sicheren Zone verschieben und skalieren.

    ## Acceptance criteria

- [ ] Logo bleibt proportional.
- [ ] Logo kann nicht außerhalb der erlaubten Zone bewegt werden.
- [ ] Min- und Max-Größe werden eingehalten.
- [ ] Eine Zurücksetzen-Funktion ist vorhanden.

## Architecture-specific implementation notes

- Logo proportional skalieren und auf die Template-Zone begrenzen.
- Keine freie Rotation.

## Source-derived technical tasks

- Logo-Transformation implementieren
- Bewegungszone definieren
- Skalierungsgrenzen anwenden
- Reset-Funktion implementieren

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
