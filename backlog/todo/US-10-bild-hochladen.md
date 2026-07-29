---
    id: US-10
    type: user-story
    title: "Bild hochladen"
    epic: "4 — Uploads und Assets"
    status: todo
    priority: must
    depends_on: [TECH-01, US-06]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
    started_at:
    completed_at:
    ---

    # US-10 — Bild hochladen

    ## User story

    > Als interner Nutzer möchte ich ein Bild hochladen, damit es automatisch in den vorgesehenen Bildbereich eingefügt wird.

    ## Acceptance criteria

- [ ] JPG und PNG werden unterstützt.
- [ ] EXIF-Ausrichtung wird berücksichtigt.
- [ ] Das Bild wird automatisch passend zugeschnitten.
- [ ] Ein mittiger Ausschnitt ist der Fallback.
- [ ] Der Nutzer kann den Ausschnitt anschließend korrigieren.

## Architecture-specific implementation notes

- Original, Preview und hochauflösendes Render-Derivat getrennt behandeln.
- EXIF-Ausrichtung bereits beim Derivat korrigieren.

## Source-derived technical tasks

- Bild-Upload implementieren
- Metadaten auslesen
- EXIF-Rotation korrigieren
- Vorschau-Thumbnail erzeugen
- initialen Crop berechnen

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
