---
    id: US-18
    type: user-story
    title: "Pflichtfelder prüfen"
    epic: "7 — Qualitätsprüfung"
    status: done
    priority: must
    depends_on: [US-06]
    verification: mixed
    context_docs: [docs/QUALITY_STRATEGY.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-18 — Pflichtfelder prüfen

    ## User story

    > Als interner Nutzer möchte ich sehen, ob alle erforderlichen Angaben vorhanden sind.

    ## Acceptance criteria

- [ ] Fehlende Pflichtfelder werden markiert.
- [ ] Der Auftrag kann nicht finalisiert werden, solange Pflichtfelder fehlen.
- [ ] Die Fehlermeldung benennt das betroffene Feld.

## Architecture-specific implementation notes

- Client-Validierung für direkte Rückmeldung; Servervalidierung blockiert die Finalisierung verbindlich.

## Source-derived technical tasks

- zentrale Formularvalidierung implementieren
- Validierungsstatus im Layout-State speichern
- Finalisierung blockieren

    ## Result

    - Changed: Added a backend validation endpoint for the current draft and a frontend quality panel that marks missing required fields inline.
    - Decisions: Treated missing required text/url/image values as blocking validation errors so the final action can be disabled deterministically.
    - Verification: `backend/.venv/bin/pytest backend/tests/test_quality.py backend/tests/test_assets.py backend/tests/test_drafts.py -q`, `cd frontend && COREPACK_HOME=/tmp/corepack corepack pnpm vitest run src/App.test.tsx`, `make test-render`, `make lint`, `make test`, `make build`
    - Remaining risks: Final release actions are not wired yet; the validation is currently surfaced in the selection UI only.
