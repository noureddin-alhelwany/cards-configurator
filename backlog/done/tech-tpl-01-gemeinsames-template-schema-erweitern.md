---
id: TECH-TPL-01
type: technical
priority: must
status: done
depends_on: [—]
title: "Gemeinsames Template-Schema erweitern"
---

# TECH-TPL-01 – Gemeinsames Template-Schema erweitern

## Acceptance Criteria

- [x] Schema speichert Dokumentwerte in Millimetern.
- [x] Referenz, Hintergrund und Zonen sind abbildbar.
- [x] Text- und QR-Regeln sind versioniert.
- [x] UI-State wird nicht persistiert.

## Result

- Erweiterte Registry-Typen für Referenz-Assets, Safe Areas sowie versionierte Text- und QR-Regeln eingeführt.
- Backend- und Frontend-Typen synchronisiert, damit das neue Template-Schema durchgängig typisiert ist.
- Registry-Test ergänzt, der die neuen Felder beim Laden validiert.
- Verifikation: `pytest backend/tests/test_registries.py`, `frontend/node_modules/.bin/tsc -p frontend/tsconfig.json --noEmit`.
