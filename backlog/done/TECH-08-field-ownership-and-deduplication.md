---
id: TECH-08
type: technical
priority: must
status: done
depends_on: [UI-27, UI-28]
title: "Feldzuständigkeit und Dopplungen im Datenmodell bereinigen"
---

# TECH-08 – Feldzuständigkeit und Dopplungen im Datenmodell bereinigen

## Acceptance Criteria

- [x] Jedes Feld hat genau eine fachliche Zuständigkeit.
- [x] Doppelte Persistenz- und Fallback-Pfade werden entfernt oder sauber migriert.
- [x] Bei unklarer Zuständigkeit stoppt der Automode und fragt nach.
- [x] Keine stillen Annahmen bei unklarer Zuordnung.

## Result

- Changed:
  - Backend-Draft- und Quality-Pfade nutzen `field_id` jetzt explizit statt still auf `variable.id` auszuweichen.
  - Frontend-Preview und Selection-Regeln behandeln nur noch echte Feldzuordnungen als fachlich relevant.
  - Das Template-Tool trennt fachliche Feldzuordnung von lokalem Draft-State-Keying.
  - Ein Regressionstest stellt sicher, dass unzugeordnete Zonen keine Feldwerte überschreiben.
- Decisions:
  - `field_id` bleibt als fachliche Zuordnung bestehen.
  - Unassigned Draft-State darf lokal weiter existieren, aber nicht mehr als stille Feldzuordnung missbraucht werden.
- Verification:
  - `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend typecheck`
  - `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/selection/selectionPreview.test.tsx src/templateTool/TemplateToolPage.test.tsx src/design/DesignRenderer.test.tsx`
  - `backend/.venv/bin/pytest backend/tests/test_drafts.py -k 'static_zones_override_customer_input_before_validation or unassigned_zone_variables_do_not_override_fields' -q`
  - `backend/.venv/bin/pytest backend/tests/test_registries.py::test_valid_registry_bundle_loads -q`
  - `backend/.venv/bin/pytest backend/tests/test_quality.py::test_validation_reports_missing_required_fields -q`
- Remaining risks:
  - The full `backend/tests/test_quality.py` file run did not return in the harness during verification, so broader quality coverage should be re-run in the next milestone.
