---
id: TECH-07
type: technical
priority: must
status: done
depends_on: [TECH-05, UI-24]
title: "Text-Fit und Renderer ohne sichtbare UX-Änderung vereinheitlichen"
---

# TECH-07 – Text-Fit und Renderer ohne sichtbare UX-Änderung vereinheitlichen

## Acceptance Criteria

- [x] Template-Tool und DesignRenderer nutzen denselben Text-Fit-Kern.
- [x] Die bestehende Nutzeroberfläche bleibt aus Sicht des Operators unverändert.
- [x] Preview und Produktionsrender bleiben geometrisch konsistent.
- [x] Die gemeinsame Logik ist durch Tests abgesichert.

## Result

- Changed:
  - `frontend/src/design/useTextFitRuntime.ts` bündelt die Laufzeitmessung und stellt nun zusätzlich eine geteilte Style-Hilfsfunktion bereit.
  - `frontend/src/design/DesignRenderer.tsx` und `frontend/src/templateTool/ZoneEditor.tsx` bauen ihre Text-Typografie über denselben gemeinsamen Helper auf.
  - `backlog/PROGRESS.md` wurde auf den abgeschlossenen Status aktualisiert.
- Decisions:
  - Die sichtbare UI bleibt unverändert.
  - Die Vereinheitlichung erfolgt nur auf Logik- und Style-Ebene.
- Verification:
  - `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend typecheck`
  - `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/design/textFit.test.ts src/design/DesignRenderer.test.tsx src/templateTool/TemplateToolPage.test.tsx`
  - `git diff --check`
- Remaining risks:
  - Weitere Text- oder Font-Styles außerhalb dieser beiden Pfade können später noch zusätzliche Vereinheitlichung brauchen.
