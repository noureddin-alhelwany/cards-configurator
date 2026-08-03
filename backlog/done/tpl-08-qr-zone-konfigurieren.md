---
id: TPL-08
type: story
priority: must
status: done
depends_on: [TPL-06]
title: "QR-Zone konfigurieren"
---

# TPL-08 – QR-Zone konfigurieren

## Acceptance Criteria

- [ ] Größe, Farben, Fehlerkorrektur und Ruhezone sind definierbar.
- [ ] Nur sichere Presets sind auswählbar.
- [ ] Mindestgröße und Kontrast werden geprüft.
- [ ] Backendrenderer bleibt maßgeblich.

## Result

QR-Zonen im Template-Tool können jetzt Fehlerkorrektur, Farbe, Hintergrund und
Ruhezone konfigurieren. Die Zone selbst bleibt die Größenquelle, der Printpfad
nutzt weiterhin den Backend-QR-Renderer. Zusätzlich prüft der Backend-Quality-Check
QR-Kontrast und Mindestgröße.

## Verification

- `./node_modules/.bin/vitest run src/templateTool/TemplateToolPage.test.tsx`
- `./node_modules/.bin/vitest run src/App.test.tsx`
- `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
- `pytest tests/test_qr.py tests/test_registries.py tests/test_template_svg_import.py`
- `python -m compileall src/cards_configurator_backend/registries src/cards_configurator_backend`
