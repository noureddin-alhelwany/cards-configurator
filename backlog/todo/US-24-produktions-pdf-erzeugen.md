---
    id: US-24
    type: user-story
    title: "Produktions-PDF erzeugen"
    epic: "9 — Produktionsdatei"
    status: todo
    priority: must
    depends_on: [TECH-04, US-23]
    verification: rendering
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
    started_at:
    completed_at:
    ---

    # US-24 — Produktions-PDF erzeugen

    ## User story

    > Als interner Nutzer möchte ich eine Produktionsdatei erzeugen, damit der Auftrag gedruckt werden kann.

    ## Acceptance criteria

- [ ] Die Datei verwendet das definierte Produktformat.
- [ ] Beschnitt wird berücksichtigt.
- [ ] Schriften und Grafiken werden korrekt eingebettet oder in Pfade umgewandelt.
- [ ] Originalbilder werden für den Export verwendet.
- [ ] Die Datei wird dem Auftrag zugeordnet.
- [ ] Ein Renderfehler wird sichtbar angezeigt.

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

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
