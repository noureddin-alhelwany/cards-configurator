---
id: UI-02
type: user-story
title: "Neues App-Grundgerüst aufsetzen"
epic: "UI"
status: in-progress
priority: must
depends_on: []
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T18:36:42Z
completed_at:
---

---
id: UI-02
type: user-story
title: "Neues App-Grundgerüst aufsetzen"
epic: "UI"
status: done
priority: must
depends_on: []
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T18:36:42Z
completed_at: 2026-07-30T18:53:57Z
---

# UI-02 – Neues App-Grundgerüst aufsetzen

## User Story

Als Nutzer möchte ich eine klar strukturierte Anwendung verwenden, damit ich den Erstellungsprozess einfach durchlaufen kann.

## Akzeptanzkriterien

Das neue Frontend besitzt getrennte Bereiche für:

- Anwendungskopf
- Fortschrittsnavigation
- Hauptinhalt
- Auswahl oder Formular
- Live-Vorschau
- Rückmeldungen
- primäre Navigation

Zusätzlich gilt:

- Es werden semantisch geeignete HTML-Elemente verwendet.
- Interaktive Elemente verwenden echte Buttons, Links und Formularelemente.
- Klickbare div-Elemente werden vermieden.
- Die Überschriftenhierarchie ist korrekt.
- Die HTML-Struktur ist auch ohne finales Design logisch verständlich.
- Mobile und Desktop verwenden dieselbe semantische Struktur.
- Keine Komponente setzt eine feste visuelle Position voraus.
- Vorschau und Eingaben sind technisch getrennte Komponenten.

## Result

- Changed: Das Frontend hat jetzt eine klare Shell mit Kopfbereich, Fortschrittsnavigation, Hauptbereich und separater Sidebar für Live-Vorschau und Rückmeldungen.
- Changed: Der Wizard arbeitet mit nutzerverständlichen Schritten und blendet den Produktschritt nur ein, wenn mehrere sinnvolle Produkte verfügbar sind.
- Changed: Auswahlzustand, Vorlage, Variantenauswahl und Freigabestatus werden zentral geführt und zwischen den Schritten konsistent weitergereicht.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
