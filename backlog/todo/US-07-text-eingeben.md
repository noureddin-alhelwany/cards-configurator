---
    id: US-07
    type: user-story
    title: "Text eingeben"
    epic: "3 — Dynamisches Formular"
    status: todo
    priority: must
    depends_on: [US-06]
    verification: frontend
    context_docs: [docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at:
    ---

    # US-07 — Text eingeben

    ## User story

    > Als interner Nutzer möchte ich Texte eingeben, damit sie automatisch im Design platziert werden.

    ## Acceptance criteria

- [ ] Jedes Textfeld besitzt ein Zeichenlimit.
- [ ] Die verbleibende Zeichenanzahl wird angezeigt.
- [ ] Maximale Zeilenanzahl wird berücksichtigt.
- [ ] Zu lange Texte werden nicht akzeptiert oder klar markiert.
- [ ] Textänderungen aktualisieren die Vorschau.

## Architecture-specific implementation notes

- Textwerte bleiben getrennt vom gerenderten Layout.
- Textmessung und Rendering müssen dieselben Font-Dateien verwenden.

## Source-derived technical tasks

- Textfeld-Komponente entwickeln
- Zeichenlimit implementieren
- Zeilen- und Größenberechnung implementieren
- Text-Overflow erkennen
- Vorschau aktualisieren

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
