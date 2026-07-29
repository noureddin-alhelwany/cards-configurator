---
    id: US-04
    type: user-story
    title: "Template auswählen"
    epic: "2 — Template-System"
    status: todo
    priority: must
    depends_on: [US-03]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/DOMAIN_MODEL.md]
    started_at:
    completed_at:
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

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
