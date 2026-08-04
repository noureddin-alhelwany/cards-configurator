# Essential Project Context

## Product

Internal web application for one print-studio operator. The operator selects a
QR category, product and prepared template, enters content, uploads assets,
performs limited crop/logo adjustments, reviews quality warnings, approves the
design, and generates a reproducible production PDF.

## First product family

QR stands/cards for local businesses:

- Google reviews
- appointment booking
- Instagram
- website
- digital menu or price list

Technically every category resolves to a normalized URL and a QR code.

## Product principle

Minimize user decisions while retaining the controls required for a professional
print result. This is not a general design editor.

## MVP user flow

```text
Select category
→ select product
→ select template
→ enter content
→ upload logo/image
→ automatic placement
→ controlled adjustment
→ quality review
→ approval
→ order snapshot
→ production PDF
```

## Core constraints

- Internal single-user application; no authentication in MVP.
- Start with one product variant and at least one complete vertical template;
  expand to three to six templates after the rendering core is proven.
- Templates and products are curated and versioned in the repository.
- Text lives in controlled zones. The editor can switch between global font
  styling and a per-zone override from the bundled font set, but there is no
  freeform movement, arbitrary layers, rotations or page-size changes.
- Preview and PDF must be geometrically consistent.
- The printer/operator still performs a manual final print and QR scan check.
- Local persistence is sufficient; architecture should allow PostgreSQL later.
- RGB workflow is accepted for MVP. Full CMYK/PDF-X is deferred.

## Final technical direction

- Backend: Python, FastAPI, Pydantic 2, SQLAlchemy 2, Alembic.
- Database: SQLite with WAL mode.
- Frontend: React, TypeScript, Vite, React Router.
- State: TanStack Query, Zustand, React Hook Form, Zod.
- Renderer: one React `DesignRenderer` for browser preview and Chromium PDF.
- PDF: Playwright/Chromium plus pikepdf for TrimBox/BleedBox.
- Images: Pillow.
- QR: Segno.
- Tests: pytest, Vitest/Testing Library, Playwright.
- Packaging: Docker; local persistent volume.
