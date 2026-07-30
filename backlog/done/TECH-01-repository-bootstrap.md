---
id: TECH-01
type: technical
title: "Repository bootstrap"
status: done
priority: must
depends_on: []
verification: mixed
context_docs: [docs/ARCHITECTURE.md, docs/STACK.md, docs/QUALITY_STRATEGY.md]
started_at: 2026-07-29
completed_at: 2026-07-29
---

# TECH-01 — Repository bootstrap

## Objective

Create the minimal runnable monorepo, stable commands and persistence skeleton without implementing product features.

## Acceptance criteria

- [x] Backend and frontend start locally through documented commands.
- [x] Python and Node dependencies are locked.
- [x] FastAPI health endpoint and React shell exist.
- [x] SQLAlchemy, Alembic and SQLite are initialized.
- [x] Frontend is built and can be served in the intended production shape.
- [x] Make targets exist for lint, typecheck, test, build, render tests and E2E.
- [x] Docker/Compose and local volume layout are documented.
- [x] Generated/runtime files are ignored by Git.

## Implementation notes

- Do not implement use-case/product/template UI.
- Choose exact compatible patch versions and record them in lockfiles, not prose.
- Create a minimal first migration and a smoke test.

## Result

- Changed: moved TECH-01 into `backlog/in-progress/` and started the bootstrap scaffold.
- Decisions: keep the MVP as a modular monolith with separate backend and frontend workspaces.
- Verification: pending implementation.
- Remaining risks: dependency installation and lockfile generation still need to be validated.
