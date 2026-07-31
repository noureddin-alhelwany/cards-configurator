---
id: UI-35
type: story
priority: should
status: done
depends_on: [UI-08]
title: "Designvorschauen stärker priorisieren"
---

# UI-35 – Designvorschauen stärker priorisieren

## User Story

Als Nutzer beziehungsweise Produktteam möchte ich diese Änderung, damit der neue produktorientierte Flow einfach, kontrolliert und verständlich bleibt.

## Acceptance Criteria

- [x] Designvorschauen nutzen deutlich mehr der verfügbaren Fläche.
- [x] Das Produktmotiv wird nicht als sehr kleine Grafik in großer Leerfläche gezeigt.
- [x] Designnamen sind kurz und klar unterscheidbar.
- [x] Beschreibungen erklären den tatsächlichen Unterschied.
- [x] Empfohlen und Ausgewählt bleiben getrennte Zustände.

## Result

Die Template-Karten zeigen jetzt mehr Vorschaufläche, die Kartenkörper sind kompakter und die Layoutvarianten heißen nur noch `Logo` und `Text`. Die Beschreibungen bleiben als Differenzierung bestehen, und die Zustände `Empfohlen` und `Ausgewählt` werden weiterhin getrennt angezeigt.

## Verification

- `./node_modules/.bin/vitest run App.test.tsx`
- `./node_modules/.bin/vite build`
