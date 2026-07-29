---
    id: US-11
    type: user-story
    title: "Bild automatisch optimieren"
    epic: "4 — Uploads und Assets"
    status: todo
    priority: should
    depends_on: [US-10]
    verification: backend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
    started_at:
    completed_at:
    ---

    # US-11 — Bild automatisch optimieren

    ## User story

    > Als interner Nutzer möchte ich, dass Bilder technisch vorbereitet werden, damit sie zuverlässig gerendert werden können.

    ## Acceptance criteria

- [ ] Bilder werden in ein unterstütztes internes Format umgewandelt.
- [ ] Sehr große Bilder werden für die Vorschau verkleinert.
- [ ] Originaldateien bleiben für den finalen Export verfügbar.
- [ ] Leichte Schärfung oder Kontrastkorrektur kann pro Template aktiviert werden.
- [ ] Die Bearbeitung verändert nicht dauerhaft die Originaldatei.

## Architecture-specific implementation notes

- Die Produktionsausgabe nutzt ein aus dem unveränderten Original erzeugtes hochauflösendes, normalisiertes Render-Derivat.
- OpenCV ist nicht Teil des MVP; Pillow genügt.

## Source-derived technical tasks

- lokales Python-Bildmodul erstellen
- Preview- und Original-Asset unterscheiden
- Bildskalierung implementieren
- optionale Filter konfigurieren
- Fehlerbehandlung implementieren

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
