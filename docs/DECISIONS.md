# Resolved Decisions

## D-001 Modular monolith

One repository and one application architecture. Rendering may run in a second
process from the same codebase without becoming a microservice.

## D-002 File-backed product/template registry

`Product`, `UseCase` and `Template` are versioned structured files. The original
phrase “create data model” means typed Pydantic domain/config models, not
editable SQL tables.

## D-003 SQLAlchemy over SQLModel

Persistence models, API schemas and domain logic remain separate.

## D-004 One renderer

Browser preview and production output use the same React `DesignRenderer`.
CairoSVG and ReportLab are not the primary layout engine.

## D-005 Playwright plus pikepdf

Chromium creates the visual PDF. pikepdf applies and validates PDF page boxes.

## D-006 Immutable originals and snapshots

Uploaded originals never change. Production uses validated derivatives generated
from originals. Orders contain immutable snapshots.

## D-007 Controlled editor

Native DOM/SVG and pointer interactions are sufficient. No free-form canvas
framework.

## D-008 RGB MVP

Accurate geometry and predictable RGB output are MVP goals. Full CMYK/PDF-X
automation is deferred.

## D-009 Synchronous-first rendering

Implement the simplest correct render path first. Persist RenderJobs and add a
local worker only when the UI needs asynchronous behavior.

## D-010 Token-aware agent workflow

`AGENTS.md` stays short. Work items link to focused context documents. Codex
should not read all product documentation or backlog files for each task.

## D-011 Background artwork as a template field, not an element

Full-bleed artwork is `TemplateDefinition.background_asset` (a filename served from
`/proof-assets/`), not a `static_asset` element. Without a box in the JSON its geometry cannot
drift from `page_*_mm`, no `kind` switch grows a case, and `/api/registries` stays small
because the file is referenced by URL instead of embedded.

This declines documented intent (`TEMPLATE_AND_RENDERING.md` lists "static asset" as an
element type). Trigger for revisiting: the first template that needs a decorative element
*above* user content.
