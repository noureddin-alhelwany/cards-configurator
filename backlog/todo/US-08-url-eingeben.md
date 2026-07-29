---
    id: US-08
    type: user-story
    title: "URL eingeben"
    epic: "3 — Dynamisches Formular"
    status: todo
    priority: must
    depends_on: [US-06]
    verification: mixed
    context_docs: [docs/QUALITY_STRATEGY.md, docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at:
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

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
