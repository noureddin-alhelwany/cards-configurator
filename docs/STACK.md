# Approved Development Stack

Exact patch versions are locked during TECH-01 after compatibility checks.
Avoid hard-coding speculative package versions in documentation.

## Runtime baseline

- Python 3.14 preferred; stay within the agreed supported range in `pyproject.toml`.
- Node.js 24 LTS.
- pnpm for JavaScript packages.
- uv for Python environments and locking.

## Backend

- FastAPI
- Pydantic 2
- pydantic-settings
- SQLAlchemy 2
- Alembic
- Uvicorn
- python-multipart
- structlog
- Typer for small maintenance/worker commands

## Frontend

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- openapi-typescript
- openapi-fetch
- Tailwind CSS
- Radix UI only for required accessible primitives
- Lucide only for simple interface icons

## Media and output

- Pillow for image metadata, EXIF correction and derivatives.
- Segno for QR codes.
- Shared React DOM/inline-SVG `DesignRenderer`.
- Playwright Chromium for PDF and screenshots.
- pikepdf for PDF boxes, metadata and validation.

## Quality

- Ruff and mypy.
- pytest.
- ESLint/typescript-eslint.
- Vitest and Testing Library.
- Playwright Test.
- Docker and Compose.
- Makefile as the stable command facade.

## Explicitly not selected

- Django, Next.js, SQLModel, Redux Toolkit.
- Fabric.js, Konva.js, OpenCV.
- ReportLab or CairoSVG as the main renderer.
- PostgreSQL, Redis, Celery, Kubernetes for MVP.
