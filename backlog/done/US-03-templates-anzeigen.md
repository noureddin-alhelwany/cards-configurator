---
    id: US-03
    type: user-story
    title: "Templates anzeigen"
    epic: "2 — Template-System"
status: done
    priority: must
    depends_on: [TECH-02, US-01, US-02]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/DOMAIN_MODEL.md]
started_at: 2026-07-30
completed_at: 2026-07-30
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

- Changed: added registry-backed template previews with name/thumbnail support, filtered the gallery by product and use case, and kept inactive templates hidden.
- Decisions: keep product selection clickable and persistent; only the template list narrows to the active product/use-case combination.
- Verification: `pnpm vitest run src/App.test.tsx`, `make lint`, `make typecheck`, `make test`, `make build`.
- Remaining risks: templates are still shown as a read-only selection list; the actual template-choosing workflow is deferred to US-04.
