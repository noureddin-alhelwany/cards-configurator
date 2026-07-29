---
    id: US-16
    type: user-story
    title: "Live-Vorschau anzeigen"
    epic: "6 — Vorschau"
    status: todo
    priority: must
    depends_on: [TECH-03, US-04]
    verification: rendering
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/ARCHITECTURE.md]
    started_at:
    completed_at:
    ---

    # US-16 — Live-Vorschau anzeigen

    ## User story

    > Als interner Nutzer möchte ich Änderungen direkt sehen, damit ich das Design beurteilen kann.

    ## Acceptance criteria

- [ ] Texte, Bilder, Logos und QR-Code werden dargestellt.
- [ ] Vorschau und Produktionsdatei verwenden dasselbe Layoutmodell.
- [ ] Die Vorschau aktualisiert sich ohne komplettes Neuladen.
- [ ] Proportionen entsprechen dem tatsächlichen Produktformat.

## Architecture-specific implementation notes

- Ein gemeinsamer React `DesignRenderer` ist die einzige Layoutimplementierung für Vorschau und Produktions-PDF.
- Layoutkoordinaten in Millimetern oder normalisierten Werten, niemals Browser-Pixeln persistieren.

## Source-derived technical tasks

- SVG- oder Canvas-Renderer implementieren
- Layout-State auf Renderer abbilden
- Asset-Positionierung implementieren
- Text-Rendering implementieren
- QR-Code integrieren

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
