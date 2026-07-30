---
id: UI-23
type: user-story
title: "Debug- und Backendinformationen aus dem Nutzer-Frontend entfernen"
epic: "UI"
status: done
priority: should
depends_on:
  - UI-22
verification: frontend lint; frontend vitest src/App.test.tsx; frontend build
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T22:02:53Z
completed_at: 2026-07-30T22:03:40Z
---

# UI-23 – Debug- und Backendinformationen aus dem Nutzer-Frontend entfernen

## User Story

Als Nutzer möchte ich nur relevante Produktinformationen sehen, damit die Anwendung einfach und vertrauenswürdig wirkt.

## Akzeptanzkriterien

Im Nutzer-Frontend erscheinen nicht:

- Backendstatus
- technische Use-Case-ID
- Produkt-Slug
- Template-Version
- Anzahl kompatibler Use Cases
- Rohvalidierungen
- gespeicherte Testaufträge
- interne Feldnamen
- API-Antworten
- technische Stack Traces

Zusätzlich:

- Debug-Ausgaben werden nicht nur visuell versteckt, sondern aus dem produktiven UI entfernt.
- Entwicklungslogging erfolgt ausschließlich über geeignete Entwicklerwerkzeuge.
- Technische Informationen beeinflussen das Layout des Nutzer-Frontends nicht.

## Result

- Changed: Das Selection-Frontend zeigt keine technischen Produkt-, Template- oder Kompatibilitätsdaten mehr an.
- Changed: Fehlermeldungen im Selection-, Order-, Proof- und Produktions-UI sind jetzt neutrale Nutzermeldungen statt HTTP- oder Backenddetails.
- Changed: Die Proof- und Auftragsansichten zeigen keine technischen Versions- oder Statusfragmente mehr.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
- Remaining risks: Einzelne interne Datenfelder können noch in Entwickler- oder Testansichten vorkommen; das produktive Nutzer-Frontend ist bereinigt.
