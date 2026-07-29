---
    id: US-01
    type: user-story
    title: "Anwendungsfall auswählen"
    epic: "1 — Produkt und Anwendungsfall"
    status: todo
    priority: must
    depends_on: [TECH-02]
    verification: frontend
    context_docs: [docs/MVP_SCOPE.md, docs/DOMAIN_MODEL.md]
    started_at:
    completed_at:
    ---

    # US-01 — Anwendungsfall auswählen

    ## User story

    > Als interner Nutzer möchte ich den Einsatzzweck auswählen, damit mir passende Produkte und Designs angezeigt werden.

    ## Acceptance criteria

- [ ] Es werden definierte Anwendungsfälle angezeigt.
- [ ] Jeder Anwendungsfall besitzt Name, Beschreibung und Vorschaubild.
- [ ] Nach der Auswahl werden nur passende Produkte und Templates angezeigt.
- [ ] Die Auswahl kann vor der Finalisierung geändert werden.

## Architecture-specific implementation notes

- `UseCase` ist eine versionierte Pydantic-Konfiguration aus `config/use-cases/`, keine SQL-Tabelle.
- Die Auswahl wird im Draft-Layout-State gespeichert.

## Source-derived technical tasks

- Datenmodell `UseCase` erstellen
- Anwendungsfälle als strukturierte Konfiguration anlegen
- Auswahlseite implementieren
- Auswahl im Konfigurationsstatus speichern

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
