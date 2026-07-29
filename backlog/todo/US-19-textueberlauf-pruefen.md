---
    id: US-19
    type: user-story
    title: "Textüberlauf prüfen"
    epic: "7 — Qualitätsprüfung"
    status: todo
    priority: must
    depends_on: [US-07, US-16]
    verification: rendering
    context_docs: [docs/QUALITY_STRATEGY.md, docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at:
    ---

    # US-19 — Textüberlauf prüfen

    ## User story

    > Als interner Nutzer möchte ich gewarnt werden, wenn ein Text nicht in den vorgesehenen Bereich passt.

    ## Acceptance criteria

- [ ] Schriftgröße wird innerhalb definierter Grenzen reduziert.
- [ ] Maximale Zeilenanzahl wird berücksichtigt.
- [ ] Nicht passend darstellbarer Text wird als Fehler markiert.
- [ ] Die betroffene Textfläche wird in der Vorschau hervorgehoben.

## Architecture-specific implementation notes

- Textmessung muss mit den tatsächlich gebündelten Fonts erfolgen.
- Automatische Schriftverkleinerung nur innerhalb der Template-Grenzen.

## Source-derived technical tasks

- Textmessung implementieren
- automatische Schriftgrößenanpassung
- Overflow-Erkennung
- Fehlermeldung anzeigen

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
