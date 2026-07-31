---
    id: US-25
    type: user-story
    title: "Rendering wiederholen"
    epic: "9 — Produktionsdatei"
status: done
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

    - Changed: Added persistent `render_jobs`, backend retry endpoint for order renderings, and job status/error tracking.
    - Decisions: Kept the retry flow synchronous-first and reused the existing order snapshot/render pipeline; failed retries preserve the last successful order files.
    - Verification: `backend/.venv/bin/pytest backend/tests`; `backend/.venv/bin/pytest backend/tests/test_orders.py backend/tests/test_migration.py`; `backend/.venv/bin/python -m compileall backend/src/cards_configurator_backend`
    - Remaining risks: The UI does not surface render-job state yet; retrying is currently backend/API driven.
