---
    id: US-23
    type: user-story
    title: "Auftrag erstellen"
    epic: "8 — Freigabe und Auftrag"
    status: todo
    priority: must
    depends_on: [TECH-01, US-22]
    verification: mixed
    context_docs: [docs/DOMAIN_MODEL.md, docs/ARCHITECTURE.md]
    started_at:
    completed_at:
    ---

    # US-23 — Auftrag erstellen

    ## User story

    > Als interner Nutzer möchte ich aus der Konfiguration einen Auftrag erstellen.

    ## Acceptance criteria

- [ ] Eine eindeutige Auftragsnummer wird erzeugt.
- [ ] Der finale Layout-State wird gespeichert.
- [ ] Template-ID und Template-Version werden gespeichert.
- [ ] Alle verwendeten Assets werden dem Auftrag zugeordnet.
- [ ] Ein Vorschaubild wird gespeichert.
- [ ] Der Auftrag erscheint in der Auftragsübersicht.

## Architecture-specific implementation notes

- Order speichert Produkt-, Template-, Layout- und Validierungs-Snapshot.
- Assets werden unveränderlich referenziert oder in den Order-Bereich manifestiert.

## Source-derived technical tasks

- Datenmodell `Order` erstellen
- Auftragsnummer generieren
- Layout-Snapshot speichern
- Assets kopieren oder fest referenzieren
- Vorschau rendern
- Auftragsdetailseite erstellen

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
