---
id: TPL-09
type: story
priority: must
status: done
depends_on: [TPL-06]
title: "Testwerte direkt eingeben"
---

# TPL-09 – Testwerte direkt eingeben

## Acceptance Criteria

- [ ] Jede Variable besitzt einen Testwert.
- [ ] Änderungen aktualisieren die Preview sofort.
- [ ] QR akzeptiert eine Test-URL.
- [ ] Testwerte werden nicht als Kundendaten gespeichert.

## Result

Jede Variable hat jetzt ein internes Testwert-Feld im Template-Tool. Textvariablen
aktualisieren die Vorschau sofort über ihren Testwert, QR-Variablen akzeptieren eine
Test-URL. Die Testwerte bleiben локal im Editor und werden nicht als Kundendaten
persistiert.

## Verification

- `./node_modules/.bin/vitest run src/templateTool/TemplateToolPage.test.tsx`
- `./node_modules/.bin/vitest run src/App.test.tsx`
- `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
- `pytest tests/test_qr.py tests/test_registries.py tests/test_template_svg_import.py -q`
- `python -m compileall src/cards_configurator_backend/registries src/cards_configurator_backend`
