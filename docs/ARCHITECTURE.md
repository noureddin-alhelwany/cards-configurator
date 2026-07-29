# Architecture

## Form

Modular monolith in one repository.

```text
React SPA
├── configurator
├── dynamic form
├── controlled editor
├── shared DesignRenderer
└── order views
        │ REST / OpenAPI
        ▼
FastAPI
├── registries
├── drafts
├── assets
├── quality
├── orders
└── rendering
        ├── SQLite
        ├── local filesystem
        ├── Playwright/Chromium
        └── pikepdf
```

## Modules

- `registries`: loads and validates product, use-case and template config.
- `drafts`: mutable configuration state and autosave revisions.
- `assets`: immutable originals plus preview/render derivatives.
- `quality`: central validation issues and finalization rules.
- `orders`: immutable snapshots and order number generation.
- `rendering`: preview, mockup, PDF, render jobs and diagnostics.

## Runtime

- One application container may serve API and built SPA.
- SQLite and generated data live in a mounted local volume.
- Rendering may begin synchronously.
- A small worker process from the same codebase may be introduced for queued
  RenderJobs; this is not a separate service architecture.
- No Redis, broker or distributed queue in MVP.

## API principles

- FastAPI OpenAPI is the contract.
- TypeScript API types are generated.
- Domain validation is server-side; client validation improves feedback.
- Write endpoints return the persisted revision/snapshot identifiers.
- Rendering errors are persisted and visible.

## Persistence principles

- Configuration files are version-controlled.
- Mutable drafts are separated from immutable orders.
- Final orders remain reproducible after templates change.
- Files are written to temporary paths, validated, then atomically renamed.
