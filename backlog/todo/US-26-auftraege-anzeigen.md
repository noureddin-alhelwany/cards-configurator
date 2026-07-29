---
    id: US-26
    type: user-story
    title: "Aufträge anzeigen"
    epic: "10 — Auftragsverwaltung"
    status: todo
    priority: must
    depends_on: [US-23]
    verification: mixed
    context_docs: [docs/DOMAIN_MODEL.md]
    started_at:
    completed_at:
    ---

    # US-26 — Aufträge anzeigen

    ## User story

    > Als interner Nutzer möchte ich alle erstellten Aufträge sehen, damit ich sie später öffnen kann.

    ## Acceptance criteria

- [ ] Auftragsnummer
- [ ] Datum
- [ ] Kunde oder Firmenname
- [ ] Produkt
- [ ] Template
- [ ] Vorschaubild

## Architecture-specific implementation notes

- Auftragsliste liest nur finale Orders, keine Drafts.

## Source-derived technical tasks

- Auftragsliste implementieren
- Sortierung nach Datum
- Vorschaubilder laden
- Detailverlinkung implementieren

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
