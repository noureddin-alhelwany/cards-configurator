---
id: US-28
type: user-story
title: "Entwurf automatisch speichern"
epic: "11 — Speicherung und Wiederherstellung"
status: done
priority: should
depends_on: [US-06]
verification: mixed
context_docs: [docs/DOMAIN_MODEL.md, docs/ARCHITECTURE.md]
started_at: 2026-07-30T23:17:28Z
completed_at: 2026-07-30T23:18:26Z
---

# US-28 — Entwurf automatisch speichern

## User story

> Als interner Nutzer möchte ich, dass meine aktuelle Konfiguration automatisch gespeichert wird.

## Acceptance criteria

- [ ] Formularwerte bleiben nach einem Neuladen erhalten.
- [ ] Layoutanpassungen bleiben erhalten.
- [ ] Der letzte aktive Entwurf kann wiederhergestellt werden.
- [ ] Noch nicht finalisierte Daten werden getrennt von Aufträgen gespeichert.

## Architecture-specific implementation notes

- Autosave debounced durchführen und eine Revisionsnummer zur Konflikterkennung verwenden.
- `localStorage` ist höchstens Notfallkopie; Backend ist die Quelle der Wahrheit.

## Source-derived technical tasks

- Draft-Datenmodell erstellen
- Autosave implementieren
- Browserzustand und Backendzustand synchronisieren
- Wiederherstellungsdialog entwickeln

## Result

- Changed: Der Draft-State trägt jetzt `updated_at`, und die UI zeigt den letzten gespeicherten Zeitpunkt im Wizard-Header an.
- Changed: Ein Reload-Test prüft, dass die aktuelle Konfiguration aus dem Backend wieder geladen wird.
- Verification: `backend/.venv/bin/pytest backend/tests/test_drafts.py`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
- Remaining risks: Die Revisions-/Konfliktlogik aus den Architekturhinweisen ist noch nicht implementiert.
