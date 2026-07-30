---
    id: US-04
    type: user-story
    title: "Template auswählen"
    epic: "2 — Template-System"
status: done
    priority: must
    depends_on: [US-03]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/DOMAIN_MODEL.md]
started_at: 2026-07-30
completed_at: 2026-07-30
    ---

    # US-04 — Template auswählen

    ## User story

    > Als interner Nutzer möchte ich ein Template auswählen, damit dessen Felder und Layoutregeln geladen werden.

    ## Acceptance criteria

- [ ] Das Template wird im aktuellen Entwurf gespeichert.
- [ ] Die zugehörigen Eingabefelder werden geladen.
- [ ] Layoutvarianten werden angezeigt.
- [ ] Template-ID und Version werden gespeichert.

## Architecture-specific implementation notes

- Draft speichert Template-ID und Version.
- Finale Orders speichern zusätzlich einen unveränderlichen Template-Snapshot.

## Source-derived technical tasks

- Template-Auswahl implementieren
- Template-Versionierung vorsehen
- Layout-State initialisieren
- Template-Assets laden

## Result

- Changed: added a persisted current-draft API for template selection, made template cards clickable, and loaded template fields and active layout variants into the selection view.
- Decisions: keep the current draft as a single persisted operator state and initialize the selected variant from the first active variant in the chosen template.
- Verification: `backend/.venv/bin/pytest backend/tests/test_drafts.py -q`, `make lint`, `make typecheck`, `make test`, `make build`.
- Remaining risks: the generated layout-state content is still minimal and the later field-editing workflow will flesh it out in US-06.
