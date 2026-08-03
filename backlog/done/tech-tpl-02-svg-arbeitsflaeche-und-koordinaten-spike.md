---
id: TECH-TPL-02
type: technical
priority: must
status: done
depends_on: [TECH-TPL-01]
title: "SVG-Arbeitsfläche und Koordinaten-Spike"
---

# TECH-TPL-02 – SVG-Arbeitsfläche und Koordinaten-Spike

## Acceptance Criteria

- [x] SVG nutzt ein gemeinsames Koordinatensystem.
- [x] Drag und Resize schreiben in das neutrale Schema.
- [x] Zoom verändert keine gespeicherten Werte.
- [x] Spike vergleicht Editor und Backendrender.

## Result

- `workspaceGeometry` kapselt das gemeinsame Dokument-Koordinatensystem für mm-Boxen, SVG-`viewBox` und Zoom-Umrechnung.
- Drag- und Resize-Operationen sind als reine mm-Transformationen modelliert, ohne Persistenz von Viewportwerten.
- `DesignRenderer` verwendet die neue Geometry-Hilfe, damit die Editor- und Render-Seite dieselben Dokumentkoordinaten sprechen.
- Verifikation: `frontend/node_modules/.bin/vitest run src/design/workspaceGeometry.test.ts src/design/DesignRenderer.test.tsx`, `frontend/node_modules/.bin/tsc -p tsconfig.json --noEmit`.
