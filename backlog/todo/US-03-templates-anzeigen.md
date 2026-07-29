---
    id: US-03
    type: user-story
    title: "Templates anzeigen"
    epic: "2 — Template-System"
    status: todo
    priority: must
    depends_on: [TECH-02, US-01, US-02]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/DOMAIN_MODEL.md]
    started_at:
    completed_at:
    ---

    # US-03 — Templates anzeigen

    ## User story

    > Als interner Nutzer möchte ich passende Templates sehen, damit ich schnell ein vorbereitetes Design auswählen kann.

    ## Acceptance criteria

- [ ] Templates werden nach Produkt und Anwendungsfall gefiltert.
- [ ] Jedes Template zeigt Name und Vorschaubild.
- [ ] Inaktive Templates werden nicht angezeigt.
- [ ] Es werden zunächst drei bis sechs Templates unterstützt.

## Architecture-specific implementation notes

- Templates werden aus `config/templates/` geladen und beim Start validiert.
- Inaktive oder ungültige Templates werden nicht angeboten.

## Source-derived technical tasks

- Template-Verzeichnisstruktur definieren
- Template-Konfigurationsschema erstellen
- Template-Loader implementieren
- Template-Übersicht entwickeln
- Template-Vorschauen laden

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
