---
id: TECH-06
type: technical
title: Kategorie nur an Produkte binden
epic: registry-model
status: done
priority: must
depends_on: []
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backend/src/cards_configurator_backend/registries/schemas.py
  - backend/src/cards_configurator_backend/registries/loader.py
  - backend/src/cards_configurator_backend/drafts/service.py
  - frontend/src/selection/selectionFlow.ts
started_at:
completed_at: 2026-08-04
---

# TECH-06 — Kategorie nur an Produkte binden

## User story

> Als Betreiber möchte ich Kategorien nur als Produktfilter pflegen, damit Templates nicht zusätzlich an Kategorien gekoppelt sind.

## Acceptance criteria

- [ ] Kategorien referenzieren Produkte statt Templates.
- [ ] Templates enthalten keine Kategorien mehr.
- [ ] Loader, Renderer-Pfade, Auswahl-Flow und Admin-Ansichten arbeiten mit der neuen Struktur.
- [ ] Bestehende Registry-JSONs sind angepasst.
- [ ] Die bestehende SQLite-Datenbank lädt auf dem aktuellen Datenstand ohne manuelle Migration.

## Architecture-specific implementation notes

- Kategorie bleibt ein Filter für die Produktauswahl.
- Template-Zuordnung läuft nur noch über `product_id`.
- Alte Daten werden in Tests und lokalen Fixtures auf die neue Struktur gebracht.

## Source-derived technical tasks

- Schema-Modelle aktualisieren.
- Registry-Loader und Validierung anpassen.
- Selection-Flow und Template-Tool anpassen.
- Registries und Testfixtures migrieren.
- Backend-Kompatibilität für vorhandene SQLite-Daten sicherstellen.

## Result

- Changed: Product- und Template-Schemas getrennt, Kategoriezuordnung auf `product.category_ids` umgestellt, Loader/Selection/Drafts/Fixtures/JSONs migriert.
- Decisions: Kategorien sind nur noch Produktfilter; Templates hängen ausschließlich an `product_id`.
- Verification: `backend/.venv/bin/ruff check backend/src/cards_configurator_backend/drafts/service.py backend/src/cards_configurator_backend/db.py backend/src/cards_configurator_backend/app.py backend/src/cards_configurator_backend/registries/schemas.py backend/src/cards_configurator_backend/registries/loader.py backend/src/cards_configurator_backend/registries/service.py backend/tests/test_registries.py backend/tests/test_background_asset.py backend/tests/test_admin.py backend/tests/test_template_svg_import.py`; `pytest backend/tests/test_registries.py backend/tests/test_background_asset.py backend/tests/test_admin.py backend/tests/test_template_svg_import.py`; `npm run lint`; `npm run test -- src/App.test.tsx src/selection/selectionCards.test.tsx src/templateTool/TemplateToolPage.test.tsx src/design/DesignRenderer.test.tsx`
- Remaining risks: Alte externe Daten oder Cache-Stände außerhalb des Repos können noch die vorherige Struktur enthalten.
