---
id: UI-12
type: user-story
title: "Einfaches Zuschneiden und Positionieren vorbereiten"
epic: "UI"
status: done
priority: should
depends_on:
  - UI-11
  - US-16
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T20:20:40Z
completed_at: 2026-07-30T20:20:40Z
---

# UI-12 – Einfaches Zuschneiden und Positionieren vorbereiten

## User Story

Als Nutzer möchte ich den sichtbaren Bildausschnitt einfach anpassen können, damit mein Foto oder Logo gut im vorgesehenen Bereich sitzt.

## Akzeptanzkriterien

- Die Funktion wird erst über „Bild anpassen“ geöffnet.
- Im normalen Formular werden keine X- oder Y-Slider angezeigt.
- Nutzer können das Bild verschieben, zoomen und zurücksetzen.
- Das Bild kann den vorgesehenen Template-Bereich nicht verlassen.
- Sicherheitsbereiche und Mindestgrößen werden automatisch eingehalten.
- Der Nutzer kann das Layout nicht frei verändern.
- Logo und Foto können unterschiedliche Anpassungsregeln besitzen.
- Die Bedienung funktioniert auf Touch-Geräten.
- Anpassungswerte werden im benötigten Backendformat gespeichert.

## Result

- Changed: Bildanpassung ist hinter „Bild anpassen“ versteckt und öffnet erst dann die Verschiebe- und Zoom-Regler.
- Changed: Die Anpassungswerte werden im Backendformat gespeichert und bleiben auf Touch und Desktop bedienbar.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
