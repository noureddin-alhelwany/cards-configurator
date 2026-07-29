---
    id: TECH-01
    type: technical
    title: "Repository bootstrap"
    status: todo
    priority: must
    depends_on: []
    verification: mixed
    context_docs: [docs/ARCHITECTURE.md, docs/STACK.md, docs/QUALITY_STRATEGY.md]
    started_at:
    completed_at:
    ---

    # TECH-01 — Repository bootstrap

    ## Objective

    Create the minimal runnable monorepo, stable commands and persistence skeleton without implementing product features.

    ## Acceptance criteria

- [ ] Backend and frontend start locally through documented commands.
- [ ] Python and Node dependencies are locked.
- [ ] FastAPI health endpoint and React shell exist.
- [ ] SQLAlchemy, Alembic and SQLite are initialized.
- [ ] Frontend is built and can be served in the intended production shape.
- [ ] Make targets exist for lint, typecheck, test, build, render tests and E2E.
- [ ] Docker/Compose and local volume layout are documented.
- [ ] Generated/runtime files are ignored by Git.

## Implementation notes

- Do not implement use-case/product/template UI.
- Choose exact compatible patch versions and record them in lockfiles, not prose.
- Create a minimal first migration and a smoke test.

    ## Result

    _Fill only when work starts or completes._

    - Changed:
    - Decisions:
    - Verification:
    - Remaining risks:
