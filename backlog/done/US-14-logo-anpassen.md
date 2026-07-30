---
    id: US-14
    type: user-story
    title: "Logo anpassen"
    epic: "5 — Kontrollierter Editor"
    status: done
    priority: must
    depends_on: [US-09, US-16]
    verification: frontend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at: 2026-07-30
    ---

    # US-14 — Logo anpassen

    ## User story

    > Als interner Nutzer möchte ich das Logo innerhalb einer sicheren Zone verschieben und skalieren.

    ## Acceptance criteria

- [ ] Logo bleibt proportional.
- [ ] Logo kann nicht außerhalb der erlaubten Zone bewegt werden.
- [ ] Min- und Max-Größe werden eingehalten.
- [ ] Eine Zurücksetzen-Funktion ist vorhanden.

## Architecture-specific implementation notes

- Logo proportional skalieren und auf die Template-Zone begrenzen.
- Keine freie Rotation.

## Source-derived technical tasks

- Logo-Transformation implementieren
- Bewegungszone definieren
- Skalierungsgrenzen anwenden
- Reset-Funktion implementieren

    ## Result

    - Changed: Logo-Transformen können nun innerhalb einer sicheren Zone verschoben und skaliert werden, inklusive Reset und sofortiger Vorschau-Aktualisierung.
    - Decisions: Das Logo bleibt proportional und wird über denselben Layout-State wie die restliche Vorschau gesteuert, damit Preview und Produktion übereinstimmen.
    - Verification: `backend/.venv/bin/pytest backend/tests/test_drafts.py backend/tests/test_assets.py backend/tests/test_rendering_proof.py -q`, `make lint`, `make typecheck`, `make test`, `make build`.
    - Remaining risks: Feinkörnige UI-Gesten wie direkte Drag-Handles sind für den MVP nicht erforderlich und können später ergänzt werden.
