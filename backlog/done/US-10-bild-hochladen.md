---
    id: US-10
    type: user-story
    title: "Bild hochladen"
    epic: "4 — Uploads und Assets"
    status: done
    priority: must
    depends_on: [TECH-01, US-06]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
    started_at:
    completed_at: 2026-07-30
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

    - Changed: Image-Uploads sind als JPEG/PNG vollständig im Asset-System verankert, inklusive EXIF-Korrektur, verkleinerter Vorschau, Render-Derivat und wiederverwendbarer Preview im Editor.
    - Decisions: Das Original bleibt unverändert; Vorschau und Render-Derivat werden getrennt erzeugt und über die Template-Felder in der UI eingebunden.
    - Verification: `backend/.venv/bin/pytest backend/tests/test_drafts.py backend/tests/test_assets.py backend/tests/test_rendering_proof.py -q`, `make lint`, `make typecheck`, `make test`, `make build`.
    - Remaining risks: Ein vollwertiger Crop-Editor ist noch nicht Teil dieses Items und wird über die späteren Kontroll-Editor-Stories ergänzt.
