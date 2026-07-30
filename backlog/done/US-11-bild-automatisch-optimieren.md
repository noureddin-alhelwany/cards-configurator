---
    id: US-11
    type: user-story
    title: "Bild automatisch optimieren"
    epic: "4 — Uploads und Assets"
    status: done
    priority: should
    depends_on: [US-10]
    verification: backend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
    started_at:
    completed_at: 2026-07-30
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

    - Changed: Image-Assets werden in interne PNG-Derivate überführt, Vorschauen werden begrenzt skaliert, Originale bleiben unverändert erhalten und das Renderer-Modell unterstützt template-seitige Bildanpassung.
    - Decisions: Pillow reicht für den MVP; OpenCV bleibt außen vor. Die moderate Bildkorrektur läuft als optionale Renderer-Eigenschaft und verändert das Original nicht.
    - Verification: `backend/.venv/bin/pytest backend/tests/test_drafts.py backend/tests/test_assets.py backend/tests/test_rendering_proof.py -q`, `make lint`, `make typecheck`, `make test`, `make build`.
    - Remaining risks: Feinere templatespezifische Filterprofile können später ergänzt werden, ohne das Asset-Speichermodell zu ändern.
