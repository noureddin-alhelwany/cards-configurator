---
    id: US-21
    type: user-story
    title: "QR-Mindestgröße prüfen"
    epic: "7 — Qualitätsprüfung"
    status: todo
    priority: must
    depends_on: [US-08, US-16]
    verification: mixed
    context_docs: [docs/QUALITY_STRATEGY.md, docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at:
    ---

    # US-21 — QR-Mindestgröße prüfen

    ## User story

    > Als interner Nutzer möchte ich gewarnt werden, wenn der QR-Code zu klein dargestellt wird.

    ## Acceptance criteria

- [ ] Die Mindestgröße wird im Produkt oder Template definiert.
- [ ] Zu kleine QR-Codes blockieren die Finalisierung.
- [ ] Der QR-Code kann im MVP nicht frei skaliert werden.
- [ ] Die Scanbarkeit wird zusätzlich manuell vor dem Druck geprüft.

## Architecture-specific implementation notes

- Neben der Gesamtgröße auch die physische Modulgröße inklusive Quiet Zone prüfen.
- Manueller Scan-Test bleibt Teil der Produktionsfreigabe.

## Source-derived technical tasks

- QR-Größe aus Layout berechnen
- Mindestwert validieren
- Fehlermeldung anzeigen

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
