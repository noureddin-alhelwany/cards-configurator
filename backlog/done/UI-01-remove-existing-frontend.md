---
id: UI-01
type: user-story
title: "Bestehendes Frontend vollständig entfernen"
epic: "UI"
status: done
priority: must
depends_on: []
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T18:30:47Z
completed_at: 2026-07-30T18:33:04Z
---

# UI-01 – Bestehendes Frontend vollständig entfernen

## User Story

Als Entwickler möchte ich das bestehende Prototype-Frontend vollständig entfernen, damit das neue Nutzer-Frontend ohne Altlasten aufgebaut werden kann.

## Akzeptanzkriterien

- [x] Die bestehende HTML-Struktur wird vollständig entfernt.
- [x] Bestehende Frontend-Komponenten werden nicht übernommen.
- [x] Bestehende Prototype-Styles werden vollständig entfernt.
- [x] Alte CSS-Klassen und Layoutannahmen werden nicht übernommen.
- [x] Die bisherige sichtbare Fünf-Schritt-Darstellung wird entfernt.
- [x] Die Backendstatus-Box wird entfernt.
- [x] Debug-Ausgaben werden aus dem Nutzer-Frontend entfernt.
- [x] Nicht mehr verwendeter Frontend-Code wird gelöscht und nicht nur ausgeblendet.
- [x] Es existiert nach der Umstellung nur noch ein produktives Nutzer-Frontend.
- [x] Backend-APIs und Geschäftslogik bleiben erhalten.

## Nicht betroffen

- Backendlogik
- Datenbankmodelle
- Template-Konfigurationen
- Preview-Generierung
- Qualitätsprüfung
- Auftragserstellung

## Result

- Changed: Alte globale `App.css` und der prototypische Backend-Statusblock wurden entfernt; das App-Shell-Frontend delegiert jetzt nur noch an die produktiven Routen.
- Decisions: Der Rücksetzen-Flow bleibt erhalten, wird aber als schlanke Action im Wizard statt als Debug-Statusbox dargestellt.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
- Remaining risks: Der gewünschte „nur ein Section pro Schritt“-Feinschliff liegt weiterhin in den späteren UI-Stories.
