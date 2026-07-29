---
    id: TECH-04
    type: technical
    title: "Production render pipeline proof"
    status: todo
    priority: must
    depends_on: [TECH-03]
    verification: rendering
    context_docs: [docs/TEMPLATE_AND_RENDERING.md, docs/QUALITY_STRATEGY.md, docs/DOMAIN_MODEL.md]
    started_at:
    completed_at:
    ---

    # TECH-04 — Production render pipeline proof

    ## Objective

    Produce and validate a physical PDF from the shared DesignRenderer.

    ## Acceptance criteria

- [ ] A protected/internal render route loads the same DesignRenderer.
- [ ] Playwright waits for fonts and explicit render readiness.
- [ ] PDF uses the configured physical page size including bleed.
- [ ] pikepdf sets and validates MediaBox, BleedBox and TrimBox.
- [ ] A preview image is produced from the same render.
- [ ] Failures return actionable diagnostics and leave no partial final file.
- [ ] Automated PDF geometry tests exist.

## Implementation notes

- RGB output is expected.
- Do not add Redis, Celery or a distributed queue.

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
