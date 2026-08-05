---
id: TPL-14
type: story
priority: must
status: done
depends_on: [TPL-01, TPL-11]
title: "Template speichern und laden"
---

# TPL-14 – Template speichern und laden

## Acceptance Criteria

- [ ] Produkt, Assets, Zonen, Regeln und Metadaten werden gespeichert.
- [ ] Neutrales Schema wird gespeichert.
- [ ] Template kann erneut geladen werden.
- [ ] Ungespeicherte Änderungen werden markiert.

## Result

- Changed: `safe_areas` moved from `TemplateDefinition` to `TemplateDesignDefinition.zones`, template JSON now writes `zones`, template tool reads zones from the selected design, and registry/admin fixtures were updated.
- Decisions: zones are now design-owned; old `safe_areas` is only accepted as a read alias for compatibility.
- Verification: `python -m pytest tests/test_registries.py tests/test_admin.py`; `./node_modules/.bin/vitest run src/design/DesignRenderer.test.tsx src/selection/selectionCards.test.tsx src/templateTool/TemplateToolPage.test.tsx`; `./node_modules/.bin/tsc -p tsconfig.json --noEmit`; `./node_modules/.bin/eslint . --max-warnings=0`
- Remaining risks: the template registry currently carries an empty `zones` array for the remaining design; if you want real authoring data, those zones still need to be filled in the registry/editor flow.
