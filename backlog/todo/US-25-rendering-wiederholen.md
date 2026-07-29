---
    id: US-25
    type: user-story
    title: "Rendering wiederholen"
    epic: "9 — Produktionsdatei"
    status: todo
    priority: should
    depends_on: [US-24]
    verification: backend
    context_docs: [docs/ARCHITECTURE.md, docs/DOMAIN_MODEL.md]
    started_at:
    completed_at:
    ---

    # US-25 — Rendering wiederholen

    ## User story

    > Als interner Nutzer möchte ich die Produktionsdatei erneut erzeugen können, falls der erste Versuch fehlschlägt.

    ## Acceptance criteria

- [ ] Fehlgeschlagene Renderings werden markiert.
- [ ] Ein erneuter Rendering-Versuch kann gestartet werden.
- [ ] Bestehende Layoutdaten bleiben unverändert.
- [ ] Die letzte erfolgreiche Datei bleibt erhalten.

## Architecture-specific implementation notes

- RenderJob persistent speichern.
- Synchronous-first ist erlaubt; kein Redis oder Celery einführen.

## Source-derived technical tasks

- Render-Job-Datenmodell erstellen
- Status `pending`, `processing`, `completed`, `failed`
- Retry-Funktion implementieren
- Fehlerprotokoll speichern

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
