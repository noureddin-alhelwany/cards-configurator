---
    id: TECH-02
    type: technical
    title: "Configuration registries and schemas"
    status: todo
    priority: must
    depends_on: [TECH-01]
    verification: backend
    context_docs: [docs/DOMAIN_MODEL.md, docs/TEMPLATE_AND_RENDERING.md]
    started_at:
    completed_at:
    ---

    # TECH-02 — Configuration registries and schemas

    ## Objective

    Implement typed, versioned file-backed registries for use cases, products and templates.

    ## Acceptance criteria

- [ ] Pydantic schemas cover use case, product and initial template definition.
- [ ] Repository config directories and one valid fixture of each type exist.
- [ ] Application validates registries at startup.
- [ ] Invalid config yields actionable diagnostics and is not exposed as active.
- [ ] Template ID/version uniqueness is enforced.
- [ ] Registry unit tests cover valid, invalid and duplicate definitions.

## Implementation notes

- No SQL tables for use cases, products or templates.
- Schema must be sufficient for the shared renderer proof, not a generic template-builder language.

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
