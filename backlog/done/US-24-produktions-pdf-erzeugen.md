---
    id: US-24
    type: user-story
    title: "Produktions-PDF erzeugen"
    epic: "9 — Produktionsdatei"
    status: done
    priority: must
    depends_on: [TECH-04, US-23]
    verification: rendering
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-24 — Produktions-PDF erzeugen

    ## User story

    > Als interner Nutzer möchte ich eine Produktionsdatei erzeugen, damit der Auftrag gedruckt werden kann.

    ## Acceptance criteria

- [x] Die Datei verwendet das definierte Produktformat.
- [x] Beschnitt wird berücksichtigt.
- [x] Schriften und Grafiken werden korrekt eingebettet oder in Pfade umgewandelt.
- [x] Originalbilder werden für den Export verwendet.
- [x] Die Datei wird dem Auftrag zugeordnet.
- [x] Ein Renderfehler wird sichtbar angezeigt.

## Architecture-specific implementation notes

- PDF über Playwright/Chromium aus dem gemeinsamen React-Renderer erzeugen.
- Anschließend TrimBox und BleedBox mit pikepdf setzen und validieren.
- Der MVP erzeugt RGB-PDF; vollständiges CMYK/PDF-X bleibt außerhalb des MVP.

## Source-derived technical tasks

- PDF-Renderer auswählen und integrieren
- Millimeter-zu-PDF-Koordinaten umrechnen
- Beschnitt umsetzen
- Schriften einbetten
- Bildassets hochauflösend rendern
- PDF-Datei speichern

    ## Result

    - Changed:
      - Added production PDF rendering for approved orders using a dedicated production render page, shared React renderer, Playwright capture, and pikepdf box validation.
      - Stored the generated PDF path on the order and exposed it via the API and order overview.
    - Decisions:
      - Reuse the shared React renderer and Playwright PDF capture path instead of building a separate Python renderer.
    - Verification:
      - `backend/.venv/bin/pytest backend/tests/test_orders.py`
      - `backend/.venv/bin/pytest backend/tests/test_pdf_pipeline.py::test_order_pdf_pipeline_sets_boxes_preview_and_pdf`
      - `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend test`
      - `make lint`
      - `make typecheck`
      - `make build`
    - Remaining risks:
      - None noted for the implemented scope.
