---
id: TECH-09
type: technical
priority: should
status: todo
depends_on: []
title: "Dark-Mode-CSS-Kaskade ohne !important bereinigen"
---

# TECH-09 – Dark-Mode-CSS-Kaskade ohne !important bereinigen

## Acceptance Criteria

- [ ] Die Dark-Mode-Regeln für globale Formulare und editierbare Zonen-Textfelder sind ohne `!important` eindeutig getrennt.
- [ ] Aktive und nicht aktive Zonen behalten ihre transparente Hintergrundfläche.
- [ ] Font-Preview, Text-Styles, Cursor und Eingabeverhalten bleiben unverändert.
- [ ] Die Theme-Regeln sind so strukturiert, dass sie später projektweit aktiviert werden können.
- [ ] Template-Tool- und Rendering-Tests laufen ohne Regression.

## Context

Die aktuelle Dark-Mode-Datei stylt allgemeine `input`- und `textarea`-Elemente. Editierbare Textfelder innerhalb einer Zone benötigen dagegen einen transparenten Hintergrund, damit die Zone und das Design darunter sichtbar bleiben. Aktuell wird diese Ausnahme über `!important` erzwungen. Das soll durch eine klare CSS-Kaskade, eine spezifische Modifikatorklasse oder eine saubere Komponentengrenze gelöst werden.

## Planned Scope

- Dark-Mode-Selektoren für Formulare und Zonen-Textfelder entkoppeln.
- Theme-Tokens und komponentenspezifische Regeln in der zentralen Dark-Mode-Datei konsistent organisieren.
- Prüfen, ob die Zonen-Modifikatorklassen eindeutig benannt und überall konsistent verwendet werden.
- Regressionstest für transparentes Zonen-Textfeld im aktiven Zustand ergänzen.

## Result

Noch nicht umgesetzt.
