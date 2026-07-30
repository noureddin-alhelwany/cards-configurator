---
    id: US-15
    type: user-story
    title: "Design zurücksetzen"
    epic: "5 — Kontrollierter Editor"
    status: done
    priority: should
    depends_on: [US-12, US-13, US-14]
    verification: frontend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-15 — Design zurücksetzen

    ## User story

    > Als interner Nutzer möchte ich Änderungen zurücksetzen, damit ich zur empfohlenen Ausgangsposition zurückkehren kann.

    ## Acceptance criteria

- [x] Einzelne Bilder und Logos können zurückgesetzt werden.
- [x] Optional kann die gesamte Seite zurückgesetzt werden.
- [x] Texte und Uploads bleiben bei einem Layout-Reset erhalten.
- [x] Eine vollständige Undo-Historie ist nicht erforderlich.

## Architecture-specific implementation notes

- Kein Undo-/Redo-System bauen.
- Reset verwendet die Defaults der gewählten Variante.

## Source-derived technical tasks

- Default-Transformationswerte speichern
- Reset pro Element implementieren
- Reset für Layoutvariante implementieren

    ## Result
    - Changed:
      - Added reset coverage for single image/logo adjustments and the whole layout.
      - Verified layout reset keeps text values and uploaded assets intact.
    - Decisions:
      - Reset actions keep text inputs and uploaded assets intact.
      - Reset uses the template defaults already stored in the renderer/model layer.
    - Verification:
      - `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend test`
      - `make lint`
      - `make typecheck`
      - `make build`
    - Remaining risks:
      - None for the implemented reset flow; follow-up work is in the remaining backlog items.
