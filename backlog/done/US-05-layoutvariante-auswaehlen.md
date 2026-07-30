---
    id: US-05
    type: user-story
    title: "Layoutvariante auswählen"
    epic: "2 — Template-System"
    status: done
    priority: should
    depends_on: [US-04]
    verification: frontend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-05 — Layoutvariante auswählen

    ## User story

    > Als interner Nutzer möchte ich zwischen vorbereiteten Layoutvarianten wählen, damit ich verschiedene Gewichtungen testen kann.

    ## Acceptance criteria

- [x] Ein Template kann eine oder mehrere Varianten besitzen.
- [x] Die Varianten verändern nur vordefinierte Positionen und Größen.
- [x] Inhalte bleiben beim Variantenwechsel erhalten.
- [x] Die Vorschau aktualisiert sich direkt.

## Architecture-specific implementation notes

- Varianten sind deklarative Overrides der Template-Definition.
- Kein zweites freies Layoutmodell einführen.

## Source-derived technical tasks

- Varianten im Template-Schema definieren
- Variantenumschaltung implementieren
- Layout-State beim Wechsel aktualisieren
- Vorschau neu rendern

    ## Result

    - Changed:
      - Added variant metadata to the template registries and draft layout state.
      - Added variant selection and persistence endpoints plus UI switching.
      - Added regression coverage for draft selection and variant persistence.
    - Decisions:
      - Kept variants declarative and stored only the active variant id in draft state.
    - Verification:
      - `backend/.venv/bin/pytest backend/tests/test_drafts.py -q`
      - `cd frontend && COREPACK_HOME=/tmp/corepack corepack pnpm vitest run src/App.test.tsx`
      - `make lint`
      - `make typecheck`
      - `make test`
      - `make build`
    - Remaining risks:
      - Full variant-aware design rendering remains part of later preview and render work.
