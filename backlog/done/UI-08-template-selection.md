---
id: UI-08
type: user-story
title: "Designauswahl erstellen"
epic: "UI"
status: done
priority: must
depends_on:
  - UI-06
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T19:00:07Z
completed_at: 2026-07-30T19:32:43Z
---

# UI-08 – Designauswahl erstellen

## User Story

Als Nutzer möchte ich anhand fertiger Vorschauen ein Design auswählen, damit ich ohne Designkenntnisse eine gute Entscheidung treffen kann.

## Beispieltemplates

### Clean

Klar, ruhig und mit viel Weißraum.

### Bold

Große Botschaft und besonders sichtbarer QR-Code.

### Warm

Freundlich und passend für Beauty, Wellness und Gastronomie.

### Premium

Reduziert und hochwertig.

## Akzeptanzkriterien

- Jedes Template wird mit vollständigem Demo-Inhalt dargestellt.
- Kein Template startet als leere Karte.
- Interne Template-IDs werden nicht angezeigt.
- Versionsnummern werden nicht angezeigt.
- Technische Produktzuordnungen werden nicht angezeigt.
- Jedes Template enthält einen verständlichen Namen, eine kurze Stilbeschreibung, eine realistische Vorschau und einen Auswahlstatus.
- Ein empfohlenes Template kann markiert werden.
- Die Auswahl ist vollständig per Tastatur bedienbar.
- Nach der Auswahl wird die Konfiguration mit passenden Standardwerten initialisiert.

## Result

- Changed: Die Template-Auswahl zeigt jetzt gerenderte Vorschau-Karten mit verständlichen Namen, Stilbeschreibung, Auswahlstatus und einer empfohlenen Vorlage.
- Changed: Die Felder sind in verständliche Gruppen umgebaut, enthalten Vorschläge und zeigen Uploads, Vorschauen und Bildanpassung nur bei Bedarf.
- Changed: Validierungsmeldungen erscheinen nutzerfreundlich und werden beim URL-Feld für QR-Fehler korrekt angezeigt.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`
