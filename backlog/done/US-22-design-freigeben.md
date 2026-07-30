---
    id: US-22
    type: user-story
    title: "Design freigeben"
    epic: "8 — Freigabe und Auftrag"
    status: done
    priority: must
    depends_on: [US-18, US-19, US-20, US-21]
    verification: e2e
    context_docs: [docs/QUALITY_STRATEGY.md, docs/MVP_SCOPE.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-22 — Design freigeben

    ## User story

    > Als interner Nutzer möchte ich das Design anhand einer kurzen Checkliste freigeben, bevor der Auftrag erstellt wird.

    ## Acceptance criteria

- [x] Texte geprüft
- [x] URL geprüft
- [x] Bildausschnitt geprüft
- [x] Vorschau freigegeben

## Architecture-specific implementation notes

- Freigabe basiert auf dem aktuell servervalidierten Draft.
- Nach Freigabe entsteht ein unveränderlicher Snapshot; der Draft selbst wird nicht als Order weiterverwendet.

## Source-derived technical tasks

- Freigabe-Dialog entwickeln
- Checkboxen implementieren
- Freigabezeitpunkt speichern
- finalen Layout-State sperren

    ## Result
    - Changed:
      - Added design approval API and frontend checklist flow.
      - Drafts are locked after approval and reject further edits with 409.
    - Decisions:
      - Approval is rejected when server validation still has blocking issues.
      - The approval snapshot stores template, variant, layout state, and checklist data on the draft.
    - Verification:
      - `backend/.venv/bin/pytest backend/tests/test_drafts.py`
      - `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend test`
      - `make lint`
      - `make typecheck`
      - `make test-e2e`
      - `make build`
    - Remaining risks:
      - None for the implemented approval flow; follow-up work is in the remaining backlog items.
