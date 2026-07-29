---
    id: US-28
    type: user-story
    title: "Entwurf automatisch speichern"
    epic: "11 — Speicherung und Wiederherstellung"
    status: todo
    priority: should
    depends_on: [US-06]
    verification: mixed
    context_docs: [docs/DOMAIN_MODEL.md, docs/ARCHITECTURE.md]
    started_at:
    completed_at:
    ---

    # US-28 — Entwurf automatisch speichern

    ## User story

    > Als interner Nutzer möchte ich, dass meine aktuelle Konfiguration automatisch gespeichert wird.

    ## Acceptance criteria

- [ ] Formularwerte bleiben nach einem Neuladen erhalten.
- [ ] Layoutanpassungen bleiben erhalten.
- [ ] Der letzte aktive Entwurf kann wiederhergestellt werden.
- [ ] Noch nicht finalisierte Daten werden getrennt von Aufträgen gespeichert.

## Architecture-specific implementation notes

- Autosave debounced durchführen und eine Revisionsnummer zur Konflikterkennung verwenden.
- `localStorage` ist höchstens Notfallkopie; Backend ist die Quelle der Wahrheit.

## Source-derived technical tasks

- Draft-Datenmodell erstellen
- Autosave implementieren
- Browserzustand und Backendzustand synchronisieren
- Wiederherstellungsdialog entwickeln

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
