---
    id: US-13
    type: user-story
    title: "Bild zoomen"
    epic: "5 — Kontrollierter Editor"
    status: done
    priority: must
    depends_on: [US-10, US-16, US-20]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-13 — Bild zoomen

    ## User story

    > Als interner Nutzer möchte ich ein Bild vergrößern oder verkleinern, damit der gewünschte Ausschnitt sichtbar ist.

    ## Acceptance criteria

- [x] Das Template definiert minimale und maximale Skalierung.
- [x] Das Bild darf den Rahmen nicht unterschreiten.
- [x] Die effektive Auflösung wird nach Skalierung neu berechnet.
- [x] Warnungen werden direkt aktualisiert.

## Architecture-specific implementation notes

- Zoom als dimensionsloser Faktor speichern.
- DPI nach jeder Änderung aus Druckgröße und sichtbarem Bildausschnitt neu berechnen.

## Source-derived technical tasks

- Zoom-Steuerung implementieren
- Min-/Max-Werte aus Template laden
- DPI nach Skalierung berechnen
- Vorschau aktualisieren

    ## Result
    - Changed:
      - Verified template image zoom is driven by normalized scale bounds.
      - Added frontend coverage for zooming an image element and watching the DPI warning update.
    - Decisions:
      - Zoom stays as a normalized scale on template image elements.
      - Validation and preview both use the same scale value so the warning reacts immediately.
    - Verification:
      - `backend/.venv/bin/pytest backend/tests/test_quality.py`
      - `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend test`
      - `make lint`
      - `make typecheck`
      - `make build`
    - Remaining risks:
      - None for the implemented zoom flow; follow-up work is in the remaining backlog items.
