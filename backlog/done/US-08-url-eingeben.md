---
    id: US-08
    type: user-story
    title: "URL eingeben"
    epic: "3 — Dynamisches Formular"
    status: done
    priority: must
    depends_on: [US-06]
    verification: mixed
    context_docs: [docs/QUALITY_STRATEGY.md, docs/TEMPLATE_AND_RENDERING.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-08 — URL eingeben

    ## User story

    > Als interner Nutzer möchte ich eine URL eingeben, damit daraus ein QR-Code erzeugt wird.

    ## Acceptance criteria

- [ ] URLs mit und ohne Protokoll werden akzeptiert.
- [ ] Fehlendes `https://` wird automatisch ergänzt.
- [ ] Ungültige Eingaben werden markiert.
- [ ] Der QR-Code aktualisiert sich nach Änderung.
- [ ] Der QR-Code wird nicht nach Plattformtyp gespeichert, sondern als URL.

## Architecture-specific implementation notes

- URL serverseitig normalisieren und als URL speichern; Plattformtypen nicht persistieren.
- QR wird mit Segno erzeugt und als kontrolliertes Render-Asset verwendet.

## Source-derived technical tasks

- URL-Normalisierung implementieren
- URL-Validierung implementieren
- QR-Code-Generator integrieren
- QR-Code als Render-Asset speichern

    ## Result

    - Changed: URL normalisation added server-side, `/api/qr` now returns the normalized URL plus SVG data URL, and draft text values normalize `url` fields before persistence.
    - Decisions: Kept QR generation server-side with Segno and stored the normalized URL as the canonical value.
    - Verification: `backend/.venv/bin/pytest backend/tests/test_drafts.py backend/tests/test_assets.py -q`, `make lint`, `make typecheck`, `make test`, `make build`.
    - Remaining risks: Additional template-specific URL validation rules are still centralized in the renderer/quality layer, not in the input widget.
