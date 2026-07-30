---
id: UI-20
type: user-story
title: "Responsive und Accessibility-Grundlage schaffen"
epic: "UI"
status: done
priority: must
depends_on:
  - UI-19
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T21:08:49Z
completed_at: 2026-07-30T21:08:49Z
---

# UI-20 – Responsive und Accessibility-Grundlage schaffen

## User Story

Als Nutzer möchte ich den Konfigurator auf verschiedenen Geräten und mit unterschiedlichen Eingabemethoden bedienen können.

## Akzeptanzkriterien

### Responsive

- Desktop kann Vorschau und Eingaben nebeneinander darstellen.
- Mobile ordnet Vorschau und Formular sinnvoll untereinander an.
- Die Vorschau kann mobil vergrößert werden.
- Buttons besitzen ausreichende Touch-Flächen.
- Upload und Bildanpassung funktionieren per Touch.
- Die Hauptaktion bleibt erreichbar, ohne Inhalte zu überdecken.
- Das HTML setzt keine feste Desktopstruktur voraus.

### Accessibility

- Alle Funktionen sind per Tastatur erreichbar.
- Dialoge besitzen korrektes Fokusmanagement.
- Formulare verwenden Labels.
- Fehler sind programmatisch den Feldern zugeordnet.
- Auswahlgruppen verwenden native HTML-Strukturen oder passende ARIA-Attribute.
- Der Fortschritt ist semantisch ausgezeichnet.
- Status wird nicht nur über Farbe vermittelt.
- Das HTML wird mit einem Accessibility-Linter geprüft.

## Result

- Changed: Die Hauptlayouts stapeln sich auf kleineren Bildschirmen sauber untereinander und die wichtigsten Aktionen bleiben per Touch erreichbar.
- Changed: Die primären Buttons haben größere Touch-Flächen und die Statusmeldungen sind semantisch statt nur visuell erkennbar.
- Changed: Fortschritt und Auswahl bleiben per Tastatur bedienbar, ohne den Flow neu aufzubauen.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
