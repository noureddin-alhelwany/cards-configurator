SHELL := /bin/bash

BACKEND_DIR := backend
FRONTEND_DIR := frontend
BACKEND_PYTHON := python3
BACKEND_VENV := $(BACKEND_DIR)/.venv
BACKEND_PIP := $(BACKEND_VENV)/bin/pip
BACKEND_PYTEST := $(BACKEND_VENV)/bin/pytest
FRONTEND_PNPM := COREPACK_HOME=/tmp/corepack corepack pnpm

.PHONY: help backend-install frontend-install backend-dev frontend-dev lint typecheck test test-render test-e2e build docker-up docker-build db-export

help:
	@echo 'backend-install   Create the Python virtual environment and install backend dependencies'
	@echo 'frontend-install  Install the frontend dependencies with pnpm'
	@echo 'backend-dev       Start the FastAPI app in development mode'
	@echo 'frontend-dev      Start the Vite dev server'
	@echo 'lint              Run backend and frontend lint checks'
	@echo 'typecheck         Run backend and frontend type checks'
	@echo 'test              Run backend and frontend test suites'
	@echo 'test-render       Run the Chromium render and PDF checks (needs a browser)'
	@echo 'test-e2e          Run the bootstrap end-to-end smoke checks'
	@echo 'build             Build the frontend bundle and validate the backend package'
	@echo 'db-export         Export the local SQLite database as a tracked SQL dump'
	@echo 'docker-build      Build the container image'
	@echo 'docker-up         Start the Compose stack'

backend-install:
	$(BACKEND_PYTHON) -m ensurepip --upgrade
	$(BACKEND_PYTHON) -m venv $(BACKEND_VENV)
	$(BACKEND_PIP) install --upgrade pip
	$(BACKEND_PIP) install -r $(BACKEND_DIR)/requirements.lock

frontend-install:
	$(FRONTEND_PNPM) install

backend-dev:
	$(BACKEND_VENV)/bin/python -m cards_configurator_backend.main

frontend-dev:
	$(FRONTEND_PNPM) --dir $(FRONTEND_DIR) dev

lint:
	$(BACKEND_VENV)/bin/ruff check $(BACKEND_DIR)
	$(FRONTEND_PNPM) --dir $(FRONTEND_DIR) lint

typecheck:
	$(BACKEND_VENV)/bin/mypy $(BACKEND_DIR)/src
	$(FRONTEND_PNPM) --dir $(FRONTEND_DIR) typecheck

test:
	$(BACKEND_PYTEST) $(BACKEND_DIR)/tests
	$(FRONTEND_PNPM) --dir $(FRONTEND_DIR) test

test-render:
	$(BACKEND_PYTEST) $(BACKEND_DIR)/tests/test_rendering_proof.py $(BACKEND_DIR)/tests/test_pdf_pipeline.py

test-e2e:
	$(FRONTEND_PNPM) --dir $(FRONTEND_DIR) test:e2e

build:
	$(FRONTEND_PNPM) --dir $(FRONTEND_DIR) build
	$(BACKEND_PYTHON) -m compileall $(BACKEND_DIR)/src

db-export:
	$(BACKEND_PYTHON) scripts/export_db.py

docker-build:
	docker compose build

docker-up:
	docker compose up --build
