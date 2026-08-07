---
id: TPL-11
type: story
priority: must
status: done
depends_on: [TPL-05]
title: "Eigenschaften numerisch bearbeiten"
---

# TPL-11 – Eigenschaften numerisch bearbeiten

## Acceptance Criteria

- [x] X, Y, Breite und Höhe sind numerisch editierbar.
- [x] Canvas und Properties Panel synchronisieren sich.
- [x] Ungültige Werte werden nicht gespeichert.

## Result

- Changed:
  - Das Properties Panel zeigt nun numerische Eingaben für `X mm`, `Y mm`, `Breite mm` und `Höhe mm`.
  - Die Werte werden über dieselbe Zone-Update-Logik wie Drag/Resize gespeichert.
  - Ungültige Eingaben werden verworfen statt still zu persistieren.
  - Ein Regressionstest prüft, dass Panel und Canvas synchron bleiben.
- Decisions:
  - Die Zone-Geometrie bleibt in Millimetern und wird nicht über einen zweiten State geführt.
  - Der bestehende Drag-/Resize-Flow bleibt erhalten.
- Verification:
  - `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend typecheck`
  - `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/templateTool/TemplateToolPage.test.tsx`
  - `git diff --check`
- Remaining risks:
  - Weitere Property-Felder wie Min-/Max-Werte oder feinere Bounds-UI könnten später noch ergänzt werden.
