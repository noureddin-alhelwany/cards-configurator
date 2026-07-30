---
    id: US-21
    type: user-story
    title: "QR-Mindestgröße prüfen"
    epic: "7 — Qualitätsprüfung"
    status: done
    priority: must
    depends_on: [US-08, US-16]
    verification: mixed
    context_docs: [docs/QUALITY_STRATEGY.md, docs/TEMPLATE_AND_RENDERING.md]
    started_at: 2026-07-30
    completed_at: 2026-07-30
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

    - Changed: Added blocking QR minimum-size validation using product thresholds and QR module geometry, and surfaced the issue in the selection quality panel.
    - Decisions: Used the printed box size minus quiet zone to estimate module pitch conservatively, so both total QR footprint and module size can fail fast.
    - Verification: `backend/.venv/bin/pytest backend/tests/test_quality.py backend/tests/test_assets.py backend/tests/test_drafts.py -q`, `cd frontend && COREPACK_HOME=/tmp/corepack corepack pnpm vitest run src/App.test.tsx`, `cd frontend && COREPACK_HOME=/tmp/corepack corepack pnpm typecheck`, `make lint`, `make test`, `make build`
    - Remaining risks: The pitch estimate is conservative and may over-warn for unusual QR layouts, which is acceptable for the MVP.
