---
id: TPL-07
type: story
priority: must
status: done
depends_on: [TPL-06]
title: "Textdarstellung definieren"
---

# TPL-07 – Textdarstellung definieren

## Acceptance Criteria

- [ ] Font, Gewicht, Größe, Mindestgröße, Zeilenhöhe und Farbe sind definierbar.
- [ ] Ausrichtung, Zeichenlimit und maximale Zeilen sind definierbar.
- [ ] Überlauf unterstützt Shrink, Umbruch oder Fehler.
- [ ] Nur Registry-Fonts sind erlaubt.

## Result

Textvariablen im Template-Tool haben jetzt eigene Textdarstellungsfelder:
Schriftfamilie, Gewicht, Schriftgröße, Mindestgröße, Zeilenhöhe, Farbe,
Ausrichtung, Zeichenlimit, maximale Zeilen und Überlaufverhalten.
Nur registrierte Fonts sind zulässig.

## Verification

- `./node_modules/.bin/vitest run src/templateTool/TemplateToolPage.test.tsx`
- `./node_modules/.bin/vitest run src/App.test.tsx`
- `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
- `pytest tests/test_registries.py tests/test_template_svg_import.py`
- `python -m compileall backend/src/cards_configurator_backend/registries`
