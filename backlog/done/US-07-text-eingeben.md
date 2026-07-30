---
    id: US-07
    type: user-story
    title: "Text eingeben"
    epic: "3 — Dynamisches Formular"
    status: done
    priority: must
    depends_on: [US-06]
    verification: frontend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-07 — Text eingeben

    ## User story

    > Als interner Nutzer möchte ich Texte eingeben, damit sie automatisch im Design platziert werden.

    ## Acceptance criteria

- [x] Jedes Textfeld besitzt ein Zeichenlimit.
- [x] Die verbleibende Zeichenanzahl wird angezeigt.
- [x] Maximale Zeilenanzahl wird berücksichtigt.
- [x] Zu lange Texte werden nicht akzeptiert oder klar markiert.
- [x] Textänderungen aktualisieren die Vorschau.

## Architecture-specific implementation notes

- Textwerte bleiben getrennt vom gerenderten Layout.
- Textmessung und Rendering müssen dieselben Font-Dateien verwenden.

## Source-derived technical tasks

- Textfeld-Komponente entwickeln
- Zeichenlimit implementieren
- Zeilen- und Größenberechnung implementieren
- Text-Overflow erkennen
- Vorschau aktualisieren

    ## Result

    - Changed:
      - Switched text fields to textareas with max-length and max-line hints.
      - Added remaining-character display and a live preview block that reflects edits immediately.
      - Extended frontend test coverage for live text updates.
    - Decisions:
      - Kept preview feedback lightweight and local to the form while the full renderer work lands later.
    - Verification:
      - `backend/.venv/bin/pytest backend/tests/test_drafts.py -q`
      - `cd frontend && COREPACK_HOME=/tmp/corepack corepack pnpm vitest run src/App.test.tsx`
      - `make lint`
      - `make typecheck`
      - `make test`
      - `make build`
    - Remaining risks:
      - Text overflow handling beyond the current limit hinting still belongs to later validation stories.
