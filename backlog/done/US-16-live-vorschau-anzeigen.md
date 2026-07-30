---
    id: US-16
    type: user-story
    title: "Live-Vorschau anzeigen"
    epic: "6 — Vorschau"
    status: done
    priority: must
    depends_on: [TECH-03, US-04]
    verification: rendering
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/ARCHITECTURE.md]
    started_at:
    completed_at: 2026-07-30
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

    - Changed: Live preview now renders the shared `DesignRenderer` with template elements, real QR previews, and uploaded asset previews; the frontend test fixture now exercises the renderer path with actual elements.
    - Decisions: Kept the renderer shared between preview and production flow and derived the preview from the same layout model used in the backend proof fixture.
    - Verification: `cd frontend && COREPACK_HOME=/tmp/corepack corepack pnpm vitest run src/App.test.tsx`, `make lint`, `make typecheck`, `make test`, `make build`.
    - Remaining risks: Upload crop/position stories remain separate and still need their own editor controls.
