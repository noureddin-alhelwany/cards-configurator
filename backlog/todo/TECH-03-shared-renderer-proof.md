---
    id: TECH-03
    type: technical
    title: "Shared renderer proof"
    status: todo
    priority: must
    depends_on: [TECH-01, TECH-02]
    verification: rendering
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md]
    started_at:
    completed_at:
    ---

    # TECH-03 — Shared renderer proof

    ## Objective

    Prove that one React DesignRenderer can render a physical page fixture with text, logo and QR.

    ## Acceptance criteria

- [ ] DesignRenderer accepts a typed template and layout state.
- [ ] One A6-with-bleed fixture renders in the browser.
- [ ] Geometry is based on millimeters/normalized values.
- [ ] A bundled local font is loaded deterministically.
- [ ] Text, PNG logo and Segno-generated QR are displayed.
- [ ] A deterministic screenshot test exists.
- [ ] No second layout implementation is introduced.

## Implementation notes

- Hard-coded example content is acceptable for this technical proof.
- Do not build crop controls or dynamic form UI yet.

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
