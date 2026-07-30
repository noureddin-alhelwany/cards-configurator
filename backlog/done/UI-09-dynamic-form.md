---
id: UI-09
type: user-story
title: "Dynamisches Personalisierungsformular erstellen"
epic: "UI"
status: done
priority: should
depends_on:
  - UI-08
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T20:20:40Z
completed_at: 2026-07-30T20:20:40Z
---

# UI-09 – Dynamisches Personalisierungsformular erstellen

## User Story

Als Nutzer möchte ich nur die Inhalte bearbeiten, die für mein Design erforderlich sind, damit das Formular kurz und verständlich bleibt.

## Mögliche Felder

- Unternehmensname
- Überschrift
- Beschreibung
- QR-Ziel
- Logo
- Foto
- Designvariante

## Akzeptanzkriterien

- Das Formular wird aus der Template-Konfiguration erzeugt.
- Backendfeldnamen werden über eine UI-Mapping-Schicht übersetzt.
- Pflichtfelder und optionale Felder sind verständlich gekennzeichnet.
- Standardwerte und Beispieltexte sind bereits vorhanden.
- Zeichengrenzen werden als verständlicher Zähler dargestellt.
- Technische Feldtypen werden nicht angezeigt.
- Änderungen werden unmittelbar an die Vorschau übergeben.
- Werte bleiben beim Wechsel zwischen den Schritten erhalten.
- Felder werden in sinnvolle Inhaltsgruppen gegliedert.

## Result

- Changed: Das Personalisierungsformular wird aus der Template-Konfiguration erzeugt und über eine UI-Mapping-Schicht in verständliche Felder übersetzt.
- Changed: Pflichtfelder, optionale Felder, Zeichenlimits, Beispieltexte und Inhaltsgruppen sind direkt im Formular sichtbar.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
