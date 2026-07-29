# Repository Rules

## Mission

Build the internal MVP described in `PROJECT_CONTEXT.md`. Keep the solution
simple, reproducible, print-aware, and extendable without overengineering.

## Context routing

- Do not read the whole repository documentation by default.
- For a normal work item, read only:
  1. this file,
  2. the active file in `backlog/in-progress/`,
  3. the files listed under its `context_docs`,
  4. existing code directly relevant to the change.
- Read `PROJECT_CONTEXT.md` at the start of a new session or when product intent
  is unclear.
- Read `docs/DECISIONS.md` only when an architecture choice is affected.
- Read `sources/` only when checking fidelity to the original requirements.
- Do not preload other backlog files.

## Work-item workflow

- Folder location is the source of truth for status.
- Keep at most one work item in `backlog/in-progress/`.
- Before coding, move the selected item from `todo` to `in-progress`, set
  `status: in-progress`, and update `backlog/PROGRESS.md`.
- Do not start an item whose dependencies are not done unless the item explicitly
  allows a vertical-slice exception.
- When complete, add a concise Result section, record verification commands,
  set `status: done`, move the file to `done`, and update `PROGRESS.md`.
- If blocked, leave it in `in-progress` and record the concrete blocker.
- Never mark an item done while an acceptance criterion is unmet.

## Scope and architecture guardrails

- Modular monolith only.
- No login, payments, checkout, shipping, email, customer portal, template
  builder, free-form design editor, generative AI, or full CMYK automation.
- Do not add microservices, Redis, Celery, Next.js, Fabric.js, Konva.js, or
  OpenCV without an explicit architecture decision.
- Product, use-case, and template definitions are versioned configuration
  files, not editable database records.
- Drafts, assets, orders, snapshots, and render jobs are persisted.
- Preview and production PDF must use the same React `DesignRenderer`.
- Persist layout geometry in millimeters or normalized values, never viewport
  pixels.
- Original uploaded assets are immutable.
- Final orders store immutable product, template, layout, and validation
  snapshots.
- The MVP production PDF is RGB. Do not claim PDF/X or full CMYK compliance.

## Engineering rules

- Prefer explicit code over premature generic frameworks.
- Keep API schemas, persistence models, and domain logic separate.
- Generate TypeScript API types from FastAPI OpenAPI; do not hand-maintain
  duplicate DTOs.
- Ask before adding or replacing a production dependency.
- Do not modify unrelated code.
- Do not commit secrets, databases, uploaded assets, generated previews, or PDFs.
- Add migrations for persistent schema changes.
- Bundle and version all fonts used by templates.
- Surface actionable errors; do not silently fall back in production rendering.

## Quality versus token cost

- During implementation run the smallest relevant test set first.
- Run the full affected layer checks once before marking the item done.
- Run end-to-end tests only for user flows, rendering, persistence boundaries,
  or when the item explicitly requires them.
- Run the complete repository suite at milestone boundaries, not after every
  tiny edit.
- Use one implementation pass and one focused review pass by default.
- Use subagents only for clearly independent work or high-risk rendering/security
  reviews.
- Keep plans to at most 8 bullets and progress summaries concise.
- Reuse existing patterns before researching alternatives.

## Verification commands

Use the commands that exist after TECH-01. Expected targets:

```bash
make lint
make typecheck
make test
make test-render
make test-e2e
make build
```

Targeted equivalents are preferred during development. Before completion, run
every command required by the active work item's `verification` field.

## Definition of done

`docs/DEFINITION_OF_DONE.md` applies to all work items. Acceptance criteria,
tests, migrations, documentation, snapshots, and error behavior must match the
actual scope of the item.
