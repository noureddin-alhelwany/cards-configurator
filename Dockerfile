FROM node:22-bookworm AS frontend-build
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY frontend/package.json frontend/package.json
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
RUN mkdir -p frontend && pnpm install
COPY frontend frontend
RUN pnpm --dir frontend build

FROM python:3.12-slim AS backend-build
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1         PYTHONUNBUFFERED=1
COPY backend backend
COPY --from=frontend-build /app/frontend/dist backend/static
RUN python -m ensurepip --upgrade &&         python -m venv /app/.venv &&         /app/.venv/bin/pip install --upgrade pip &&         /app/.venv/bin/pip install -e backend

FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1         PYTHONUNBUFFERED=1         PATH="/app/.venv/bin:${PATH}"
COPY --from=backend-build /app/.venv /app/.venv
COPY backend backend
COPY --from=frontend-build /app/frontend/dist frontend/dist
RUN mkdir -p /app/data
EXPOSE 8000
CMD ["uvicorn", "cards_configurator_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
