---
    id: US-17
    type: user-story
    title: "Produkt-Mockup anzeigen"
    epic: "6 — Vorschau"
    status: done
    priority: should
    depends_on: [US-16, TECH-04]
    verification: rendering
    context_docs: [docs/TEMPLATE_AND_RENDERING.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-17 — Produkt-Mockup anzeigen

    ## User story

    > Als interner Nutzer möchte ich das Design in einem einfachen Produkt-Mockup sehen, damit ich die Wirkung besser beurteilen kann.

    ## Acceptance criteria

- [ ] Das aktuelle Design wird in ein vorbereitetes Mockup eingesetzt.
- [ ] Das Mockup ist nicht Grundlage für die Druckproduktion.
- [ ] Eine statische perspektivische Darstellung reicht aus.
- [ ] Das Mockup aktualisiert sich nach relevanten Änderungen.

## Architecture-specific implementation notes

- Mockup ist nur eine Präsentationsdarstellung und darf nie Produktionsgrundlage sein.
- Aus demselben Design-Render ein statisches Bild ableiten.

## Source-derived technical tasks

- Mockup-Vorlage erstellen
- gerenderte Vorschau in Mockup einsetzen
- Mockup-Bild erzeugen
- Ladezustand darstellen

    ## Result

    - Changed: Added a product-mockup presentation around the shared `DesignRenderer`, with a dedicated frame and live refresh on layout changes.
    - Decisions: Kept the mockup strictly presentational; it reuses the same rendered design and does not affect production output.
    - Verification: `backend/.venv/bin/pytest backend/tests/test_quality.py backend/tests/test_assets.py backend/tests/test_drafts.py -q`, `cd frontend && COREPACK_HOME=/tmp/corepack corepack pnpm vitest run src/App.test.tsx`, `make test-render`, `make lint`, `make test`, `make build`
    - Remaining risks: The mockup is intentionally simple and static; it is not a photorealistic product simulation.
