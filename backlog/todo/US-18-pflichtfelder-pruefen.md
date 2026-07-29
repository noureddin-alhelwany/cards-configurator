---
    id: US-18
    type: user-story
    title: "Pflichtfelder prüfen"
    epic: "7 — Qualitätsprüfung"
    status: todo
    priority: must
    depends_on: [US-06]
    verification: mixed
    context_docs: [docs/QUALITY_STRATEGY.md]
    started_at:
    completed_at:
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

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
