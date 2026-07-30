---
    id: US-06
    type: user-story
    title: "Template-Felder anzeigen"
    epic: "3 — Dynamisches Formular"
    status: done
    priority: must
    depends_on: [US-04]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/DOMAIN_MODEL.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-06 — Template-Felder anzeigen

    ## User story

    > Als interner Nutzer möchte ich nur die Felder sehen, die für das ausgewählte Template benötigt werden.

    ## Acceptance criteria

- [x] Felder werden aus der Template-Konfiguration erzeugt.
- [x] Pflichtfelder sind gekennzeichnet.
- [x] Optionale Felder können leer bleiben.
- [x] Unterstützt werden zunächst Text, URL, Bild und Logo.

## Architecture-specific implementation notes

- Frontend-Formulare werden aus der Template-Definition erzeugt.
- Serverseitige Pydantic-Validierung bleibt die letzte Instanz.

## Source-derived technical tasks

- dynamischen Formular-Renderer implementieren
- Feldtypen definieren
- Validierungsregeln laden
- Formulardaten im Layout-State speichern

    ## Result

    - Changed:
      - Rendered template-defined text, URL, logo, and image fields from registry config.
      - Persisted field values through draft layout state.
      - Added regression coverage for field rendering and draft persistence.
    - Decisions:
      - Kept a single dynamic form renderer driven by the template schema.
    - Verification:
      - `backend/.venv/bin/pytest backend/tests/test_drafts.py -q`
      - `cd frontend && COREPACK_HOME=/tmp/corepack corepack pnpm vitest run src/App.test.tsx`
      - `make lint`
      - `make typecheck`
      - `make test`
      - `make build`
    - Remaining risks:
      - Field-level validation is still lightweight and later stories handle deeper checks.
