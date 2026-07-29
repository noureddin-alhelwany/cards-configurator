---
    id: US-05
    type: user-story
    title: "Layoutvariante auswählen"
    epic: "2 — Template-System"
    status: todo
    priority: should
    depends_on: [US-04]
    verification: frontend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at:
    ---

    # US-05 — Layoutvariante auswählen

    ## User story

    > Als interner Nutzer möchte ich zwischen vorbereiteten Layoutvarianten wählen, damit ich verschiedene Gewichtungen testen kann.

    ## Acceptance criteria

- [ ] Ein Template kann eine oder mehrere Varianten besitzen.
- [ ] Die Varianten verändern nur vordefinierte Positionen und Größen.
- [ ] Inhalte bleiben beim Variantenwechsel erhalten.
- [ ] Die Vorschau aktualisiert sich direkt.

## Architecture-specific implementation notes

- Varianten sind deklarative Overrides der Template-Definition.
- Kein zweites freies Layoutmodell einführen.

## Source-derived technical tasks

- Varianten im Template-Schema definieren
- Variantenumschaltung implementieren
- Layout-State beim Wechsel aktualisieren
- Vorschau neu rendern

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
