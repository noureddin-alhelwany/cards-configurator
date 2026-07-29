---
    id: US-06
    type: user-story
    title: "Template-Felder anzeigen"
    epic: "3 — Dynamisches Formular"
    status: todo
    priority: must
    depends_on: [US-04]
    verification: mixed
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/DOMAIN_MODEL.md]
    started_at:
    completed_at:
    ---

    # US-06 — Template-Felder anzeigen

    ## User story

    > Als interner Nutzer möchte ich nur die Felder sehen, die für das ausgewählte Template benötigt werden.

    ## Acceptance criteria

- [ ] Felder werden aus der Template-Konfiguration erzeugt.
- [ ] Pflichtfelder sind gekennzeichnet.
- [ ] Optionale Felder können leer bleiben.
- [ ] Unterstützt werden zunächst Text, URL, Bild und Logo.

## Architecture-specific implementation notes

- Frontend-Formulare werden aus der Template-Definition erzeugt.
- Serverseitige Pydantic-Validierung bleibt die letzte Instanz.

## Source-derived technical tasks

- dynamischen Formular-Renderer implementieren
- Feldtypen definieren
- Validierungsregeln laden
- Formulardaten im Layout-State speichern

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
