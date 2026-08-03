---
id: TPL-02
type: story
priority: must
status: done
depends_on: [TPL-01]
title: "Referenz und Produktionshintergrund hochladen"
---

# TPL-02 – Referenz und Produktionshintergrund hochladen

## Acceptance Criteria

- [x] Zwei getrennte Dateien können hochgeladen werden.
- [x] Abmessungen und Ausrichtung werden geprüft.
- [x] Nicht passende Dateien blockieren Veröffentlichung.
- [x] Referenz wird nie produziert.

## Result

- `svg_import.py` kann Referenz- und Produktionshintergrund getrennt entgegennehmen, schreibt beide Asset-Pfade ins Template und verweigert Export bei Mismatch.
- Der Registry-Loader prüft Referenz- und Hintergrundgeometrie gemeinsam und entfernt nicht passende Templates aus dem aktiven Satz.
- Produktionspfade bleiben referenzfrei; die Referenz wird nur als Editor-/Authoring-Asset geführt.
- Verifikation: `pytest backend/tests/test_template_svg_import.py backend/tests/test_background_asset.py`, `python -m compileall backend/src/cards_configurator_backend/registries`.
