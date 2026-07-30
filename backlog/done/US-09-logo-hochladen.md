---
    id: US-09
    type: user-story
    title: "Logo hochladen"
    epic: "4 — Uploads und Assets"
    status: done
    priority: must
    depends_on: [TECH-01, US-06]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
    ---

    # US-09 — Logo hochladen

    ## User story

    > Als interner Nutzer möchte ich ein Logo hochladen, damit es automatisch im Logo-Bereich des Templates platziert wird.

    ## Acceptance criteria

- [ ] PNG, JPG und SVG werden unterstützt.
- [ ] Das Seitenverhältnis bleibt erhalten.
- [ ] Das Logo wird standardmäßig vollständig sichtbar dargestellt.
- [ ] Das Logo kann innerhalb einer definierten Zone angepasst werden.
- [ ] Ungültige Dateien werden abgelehnt.

## Architecture-specific implementation notes

- Originaldatei unverändert speichern.
- SVG erst als abgeschlossen markieren, wenn externe Referenzen, Scripts und Event-Handler sicher behandelt werden.

## Source-derived technical tasks

- Upload-Endpunkt implementieren
- Dateityp und Dateigröße prüfen
- SVG-Dateien bereinigen
- Vorschaudatei erzeugen
- Asset im Entwurf speichern

    ## Result

    - Changed: Logo-Uploads werden jetzt als PNG/JPG/SVG verarbeitet, serverseitig gespeichert, in der Vorlage wiederverwendet und im Editor mit sichtbarer Vorschau plus Transform-Reglern dargestellt.
    - Decisions: Das Logo nutzt denselben Asset-Upload- und Renderpfad wie andere Bildassets; SVG bleibt sanitisiert und die Layoutanpassung wird als normalisierte Elementverschiebung gespeichert.
    - Verification: `backend/.venv/bin/pytest backend/tests/test_drafts.py backend/tests/test_assets.py backend/tests/test_rendering_proof.py -q`, `make lint`, `make typecheck`, `make test`, `make build`.
    - Remaining risks: Template-spezifische Größenregeln bleiben in der jeweiligen Template-Geometrie und nicht im Datei-Upload.
