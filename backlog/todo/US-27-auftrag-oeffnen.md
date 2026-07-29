---
    id: US-27
    type: user-story
    title: "Auftrag öffnen"
    epic: "10 — Auftragsverwaltung"
    status: todo
    priority: must
    depends_on: [US-23, US-24]
    verification: e2e
    context_docs: [docs/DOMAIN_MODEL.md, docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at:
    ---

    # US-27 — Auftrag öffnen

    ## User story

    > Als interner Nutzer möchte ich einen Auftrag öffnen, damit ich dessen Inhalte und Produktionsdateien sehen kann.

    ## Acceptance criteria

- [ ] alle Kundeneingaben
- [ ] verwendetes Template
- [ ] Layoutvariante
- [ ] finale Vorschau
- [ ] Produkt-Mockup
- [ ] hochgeladene Assets
- [ ] Produktions-PDF
- [ ] Freigabezeitpunkt

## Architecture-specific implementation notes

- Detailansicht zeigt ausschließlich gespeicherte Snapshots und finale Artefakte.
- Ein alter Auftrag darf sich durch spätere Template-Änderungen nicht verändern.

## Source-derived technical tasks

- Auftragsdetailseite entwickeln
- Layout-Snapshot anzeigen
- Assets zugänglich machen
- PDF öffnen oder herunterladen

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
