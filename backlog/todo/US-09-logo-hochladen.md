---
    id: US-09
    type: user-story
    title: "Logo hochladen"
    epic: "4 — Uploads und Assets"
    status: todo
    priority: must
    depends_on: [TECH-01, US-06]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
    started_at:
    completed_at:
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

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
