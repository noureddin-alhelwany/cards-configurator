---
id: UI-16
type: user-story
title: "Automatische Qualitätsprüfung darstellen"
epic: "UI"
status: done
priority: must
depends_on:
  - UI-15
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T20:37:12Z
completed_at: 2026-07-30T20:37:12Z
---

# UI-16 – Automatische Qualitätsprüfung darstellen

## User Story

Als Nutzer möchte ich wissen, dass meine Karte technisch druckfähig ist, ohne selbst Druckdaten prüfen zu müssen.

## Geprüfte Punkte

- Pflichtinhalte vorhanden
- QR-Code gültig
- QR-Code ausreichend groß
- Bildauflösung ausreichend
- Inhalte innerhalb der vorgesehenen Bereiche
- Vorschau erfolgreich generiert

## Akzeptanzkriterien

- Die UI zeigt verständliche Ergebnisse statt technischer Messwerte.
- Erfolgreiche Prüfungen werden positiv bestätigt.
- Probleme werden mit einer konkreten Handlungsempfehlung dargestellt.
- DPI-Berechnungen werden im normalen Flow nicht angezeigt.
- Interne Validierungscodes werden nicht angezeigt.
- Backendantworten und Stack Traces werden niemals ausgegeben.
- Die Prüfung aktualisiert sich nach relevanten Änderungen automatisch.

## Result

- Changed: Die Qualitätsprüfung erscheint im Flow als verständliche Checkliste mit positiven Rückmeldungen und konkreten Handlungsempfehlungen.
- Changed: Technische Messwerte und interne Codes bleiben verborgen; die Prüfung aktualisiert sich nach Änderungen automatisch.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
