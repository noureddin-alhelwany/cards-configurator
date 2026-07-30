---
id: UI-07
type: user-story
title: "Produktauswahl dynamisch anzeigen"
epic: "UI"
status: done
priority: should
depends_on:
  - UI-06
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T20:20:40Z
completed_at: 2026-07-30T20:20:40Z
---

# UI-07 – Produktauswahl dynamisch anzeigen

## User Story

Als Nutzer möchte ich nur dann ein Kartenformat auswählen, wenn mehrere sinnvolle Formate verfügbar sind, damit ich keine unnötige Entscheidung treffen muss.

## Beispielprodukte

### A6 Standardkarte

- 105 × 148 mm
- ideal für Theke, Übergabe und Pakete
- empfohlen

### A7 Minikarte

- 74 × 105 mm
- kompakt zum Mitgeben

### Tischaufsteller

- für Empfang, Salon und Gastronomie

## Akzeptanzkriterien

- Bei genau einem kompatiblen Produkt erfolgt die Auswahl automatisch.
- Bei automatischer Auswahl wird kein eigener Schritt angezeigt.
- Bei mehreren Produkten wird eine verständliche Produktauswahl angezeigt.
- Jedes Produkt enthält Name, Format, Einsatzzweck, Vorschau und optional eine Empfehlung.
- Technische Werte wie DPI, Bleed oder QR-Mindestgröße werden nicht angezeigt.
- Technische Produktdaten bleiben intern verfügbar.
- Nach der Auswahl werden nur kompatible Templates geladen.

## Result

- Changed: Die Produktauswahl filtert jetzt auf kompatible Produkte und überspringt den Produktschritt, wenn nur ein Produkt sinnvoll verfügbar ist.
- Changed: Produktkarten zeigen Name, Format, Vorschaubild, Einsatzzweck und Empfehlung, aber keine technischen Kennwerte.
- Verification: `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend lint`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend exec vitest run src/App.test.tsx`; `COREPACK_HOME=/tmp/corepack corepack pnpm --dir frontend build`
