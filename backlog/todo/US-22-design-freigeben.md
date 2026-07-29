---
    id: US-22
    type: user-story
    title: "Design freigeben"
    epic: "8 — Freigabe und Auftrag"
    status: todo
    priority: must
    depends_on: [US-18, US-19, US-20, US-21]
    verification: e2e
    context_docs: [docs/QUALITY_STRATEGY.md, docs/MVP_SCOPE.md]
    started_at:
    completed_at:
    ---

    # US-22 — Design freigeben

    ## User story

    > Als interner Nutzer möchte ich das Design anhand einer kurzen Checkliste freigeben, bevor der Auftrag erstellt wird.

    ## Acceptance criteria

- [ ] Texte geprüft
- [ ] URL geprüft
- [ ] Bildausschnitt geprüft
- [ ] Vorschau freigegeben

## Architecture-specific implementation notes

- Freigabe basiert auf dem aktuell servervalidierten Draft.
- Nach Freigabe entsteht ein unveränderlicher Snapshot; der Draft selbst wird nicht als Order weiterverwendet.

## Source-derived technical tasks

- Freigabe-Dialog entwickeln
- Checkboxen implementieren
- Freigabezeitpunkt speichern
- finalen Layout-State sperren

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
