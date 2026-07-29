---
    id: US-02
    type: user-story
    title: "Produkt auswählen"
    epic: "1 — Produkt und Anwendungsfall"
    status: todo
    priority: must
    depends_on: [TECH-02, US-01]
    verification: mixed
    context_docs: [docs/MVP_SCOPE.md, docs/DOMAIN_MODEL.md]
    started_at:
    completed_at:
    ---

    # US-02 — Produkt auswählen

    ## User story

    > Als interner Nutzer möchte ich ein Produkt auswählen, damit Format und Druckregeln festgelegt werden.

    ## Acceptance criteria

- [ ] Produktname, Format und Vorschau werden angezeigt.
- [ ] Nur aktive Produkte werden angeboten.
- [ ] Das Produkt definiert Größe, Beschnitt und Auflösungsgrenzen.
- [ ] Ein Produkt kann mehreren Anwendungsfällen zugeordnet werden.

## Architecture-specific implementation notes

- `Product` ist eine versionierte Konfigurationsdatei, keine SQL-Tabelle.
- Der erste vertikale Durchstich darf genau ein Produkt enthalten.

## Source-derived technical tasks

- Datenmodell `Product` erstellen
- Produktkonfiguration definieren
- Produktübersicht implementieren
- Produktregeln in Layout-State übernehmen

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
