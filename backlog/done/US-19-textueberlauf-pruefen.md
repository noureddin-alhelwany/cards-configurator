---
    id: US-19
    type: user-story
    title: "Textüberlauf prüfen"
    epic: "7 — Qualitätsprüfung"
    status: done
    priority: must
    depends_on: [US-07, US-16]
    verification: rendering
    context_docs: [docs/QUALITY_STRATEGY.md, docs/TEMPLATE_AND_RENDERING.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-19 — Textüberlauf prüfen

    ## User story

    > Als interner Nutzer möchte ich gewarnt werden, wenn ein Text nicht in den vorgesehenen Bereich passt.

    ## Acceptance criteria

- [ ] Schriftgröße wird innerhalb definierter Grenzen reduziert.
- [ ] Maximale Zeilenanzahl wird berücksichtigt.
- [ ] Nicht passend darstellbarer Text wird als Fehler markiert.
- [ ] Die betroffene Textfläche wird in der Vorschau hervorgehoben.

## Architecture-specific implementation notes

- Textmessung muss mit den tatsächlich gebündelten Fonts erfolgen.
- Automatische Schriftverkleinerung nur innerhalb der Template-Grenzen.

## Source-derived technical tasks

- Textmessung implementieren
- automatische Schriftgrößenanpassung
- Overflow-Erkennung
- Fehlermeldung anzeigen

    ## Result

    - Changed: Implemented text overflow estimation in the backend and connected the shared renderer to shrink text within template bounds while flagging overflow issues in the UI.
    - Decisions: Used a conservative text-fit estimate based on box size, line count, and template font metrics, then marked severe overflows as blocking.
    - Verification: `backend/.venv/bin/pytest backend/tests/test_quality.py backend/tests/test_assets.py backend/tests/test_drafts.py -q`, `cd frontend && COREPACK_HOME=/tmp/corepack corepack pnpm vitest run src/App.test.tsx`, `make test-render`, `make lint`, `make test`, `make build`
    - Remaining risks: The fit heuristic is approximate; extremely complex typography may still need manual adjustment in later stories.
