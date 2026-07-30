from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from .assets import load_asset, store_uploaded_asset
from .config import get_settings
from .db import get_session_factory
from .drafts import (
    ApprovalRequest,
    DraftState,
    LayoutStateUpdateRequest,
    TemplateSelectionRequest,
    approve_draft,
    get_current_draft,
    save_template_selection,
    update_layout_state,
)
from .quality import validate_current_draft
from .registries.loader import load_registry_bundle
from .registries.service import build_proof_fixture
from .rendering.service import render_proof_artifacts
from .urls import build_qr_data_url, normalize_url

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "cards-configurator-backend"}


@router.get("/registries")
def registries(request: Request) -> dict[str, object]:
    bundle = getattr(request.app.state, "registry_bundle", None)
    if bundle is None:
        bundle = load_registry_bundle(get_settings().registries_dir)
    return bundle.model_dump()


@router.get("/render/proof-fixture")
def render_proof_fixture(request: Request) -> dict[str, object]:
    settings = get_settings()
    bundle = getattr(request.app.state, "registry_bundle", None)
    if bundle is None:
        bundle = load_registry_bundle(settings.registries_dir)
    fixture = build_proof_fixture(bundle, settings.proof_assets_dir)
    return fixture.model_dump()


@router.get("/drafts/current", response_model=DraftState)
def current_draft() -> DraftState:
    session = get_session_factory()()
    try:
        return get_current_draft(session)
    finally:
        session.close()


@router.get("/drafts/current/validation")
def current_draft_validation(request: Request) -> dict[str, object]:
    settings = get_settings()
    bundle = getattr(request.app.state, "registry_bundle", None)
    if bundle is None:
        bundle = load_registry_bundle(settings.registries_dir)

    session = get_session_factory()()
    try:
        draft = get_current_draft(session)
        report = validate_current_draft(settings.data_dir, bundle, draft)
        return report.model_dump()
    finally:
        session.close()


@router.post("/drafts/current/template", response_model=DraftState)
def select_template(request: Request, selection: TemplateSelectionRequest) -> DraftState:
    settings = get_settings()
    bundle = getattr(request.app.state, "registry_bundle", None)
    if bundle is None:
        bundle = load_registry_bundle(settings.registries_dir)

    session = get_session_factory()()
    try:
        return save_template_selection(session, bundle, selection)
    finally:
        session.close()


@router.post("/drafts/current/approval", response_model=DraftState)
def approve_current_draft(request: Request, body: ApprovalRequest) -> DraftState:
    settings = get_settings()
    bundle = getattr(request.app.state, "registry_bundle", None)
    if bundle is None:
        bundle = load_registry_bundle(settings.registries_dir)

    session = get_session_factory()()
    try:
        draft = get_current_draft(session)
        report = validate_current_draft(settings.data_dir, bundle, draft)
        if report.blocking:
            raise HTTPException(status_code=400, detail="Blocking issues must be resolved before approval")
        return approve_draft(session, bundle, body)
    finally:
        session.close()


@router.patch("/drafts/current/layout", response_model=DraftState)
def patch_layout(request: Request, body: LayoutStateUpdateRequest) -> DraftState:
    session = get_session_factory()()
    try:
        settings = get_settings()
        bundle = getattr(request.app.state, "registry_bundle", None)
        if bundle is None:
            bundle = load_registry_bundle(settings.registries_dir)
        return update_layout_state(session, bundle, body)
    finally:
        session.close()


@router.get("/qr")
def qr_preview(value: str) -> dict[str, str]:
    normalized = normalize_url(value)
    return {"value": normalized, "data_url": build_qr_data_url(normalized)}


@router.post("/assets")
async def upload_asset(request: Request, kind: str, filename: str, mime_type: str) -> dict[str, object]:
    settings = get_settings()
    body = await request.body()
    return store_uploaded_asset(settings.data_dir, kind=kind, filename=filename, mime_type=mime_type, body=body)


@router.get("/assets/{asset_id}")
def get_asset(asset_id: str) -> dict[str, object]:
    settings = get_settings()
    return load_asset(settings.data_dir, asset_id)


@router.post("/render/proof")
async def render_proof(request: Request) -> dict[str, object]:
    settings = get_settings()
    bundle = getattr(request.app.state, "registry_bundle", None)
    if bundle is None:
        bundle = load_registry_bundle(settings.registries_dir)
    fixture = build_proof_fixture(bundle, settings.proof_assets_dir)
    page_url = str(request.base_url).rstrip("/") + "/render/proof"
    artifacts = await render_proof_artifacts(
        page_url=page_url,
        template=fixture.template,
        layout_state=fixture.layout_state,
        assets=fixture.assets,
        output_dir=settings.data_dir / "render-proof",
    )
    return artifacts.model_dump()
