from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse

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
    reset_current_draft,
    save_template_selection,
    update_layout_state,
)
from .fontsource import load_fontsource_catalog, load_fontsource_font_face
from .orders import (
    OrderDetail,
    OrderSummary,
    create_order,
    get_order,
    get_order_fixture,
    list_orders,
)
from .orders.schemas import RenderJobState
from .quality import validate_current_draft
from .registries.loader import load_registry_bundle
from .registries.service import build_proof_fixture
from .rendering import list_render_jobs, retry_order_render_job
from .rendering.service import render_proof_artifacts
from .urls import QR_DARK_DEFAULT, build_qr_data_url, normalize_url

router = APIRouter(prefix="/api", tags=["system"])


def _load_current_registry_bundle(request: Request):
    settings = get_settings()
    bundle = load_registry_bundle(settings.registries_dir, settings.proof_assets_dir)
    request.app.state.registry_bundle = bundle
    return bundle


@router.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "cards-configurator-backend"}


@router.get("/registries")
def registries(request: Request) -> dict[str, object]:
    bundle = _load_current_registry_bundle(request)
    return bundle.model_dump()


@router.get("/font-catalog")
def font_catalog() -> list[dict[str, object]]:
    return load_fontsource_catalog()


@router.get("/font-catalog/{font_id}")
def font_catalog_font(font_id: str) -> dict[str, object]:
    try:
        return load_fontsource_font_face(font_id)
    except (httpx.HTTPError, TypeError) as exc:
        raise HTTPException(status_code=404, detail=f"Fontsource font '{font_id}' is unavailable") from exc


@router.get("/render/proof-fixture")
def render_proof_fixture(request: Request) -> dict[str, object]:
    settings = get_settings()
    bundle = _load_current_registry_bundle(request)
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
    bundle = _load_current_registry_bundle(request)

    session = get_session_factory()()
    try:
        draft = get_current_draft(session)
        report = validate_current_draft(settings.data_dir, bundle, draft)
        return report.model_dump()
    finally:
        session.close()


@router.post("/drafts/current/template", response_model=DraftState)
def select_template(request: Request, selection: TemplateSelectionRequest) -> DraftState:
    bundle = _load_current_registry_bundle(request)

    session = get_session_factory()()
    try:
        return save_template_selection(session, bundle, selection)
    finally:
        session.close()


@router.post("/drafts/current/approval", response_model=DraftState)
def approve_current_draft(request: Request, body: ApprovalRequest) -> DraftState:
    settings = get_settings()
    bundle = _load_current_registry_bundle(request)

    session = get_session_factory()()
    try:
        draft = get_current_draft(session)
        report = validate_current_draft(settings.data_dir, bundle, draft)
        if report.blocking:
            raise HTTPException(status_code=400, detail="Blocking issues must be resolved before approval")
        return approve_draft(session, bundle, body)
    finally:
        session.close()


@router.post("/drafts/current/reset", response_model=DraftState)
def reset_current_draft_route() -> DraftState:
    session = get_session_factory()()
    try:
        return reset_current_draft(session)
    finally:
        session.close()


@router.get("/orders", response_model=list[OrderSummary])
def orders_list() -> list[OrderSummary]:
    session = get_session_factory()()
    try:
        return list_orders(session)
    finally:
        session.close()


@router.get("/orders/{order_id}", response_model=OrderDetail)
def order_detail(order_id: str) -> OrderDetail:
    session = get_session_factory()()
    try:
        return get_order(session, order_id)
    finally:
        session.close()


@router.get("/orders/{order_id}/preview")
def order_preview(order_id: str) -> FileResponse:
    session = get_session_factory()()
    try:
        order = get_order(session, order_id)
        if order.preview_path is None:
            raise HTTPException(status_code=404, detail="Order preview not available")
        return FileResponse(order.preview_path, media_type="image/png", filename=f"{order.order_number}-preview.png")
    finally:
        session.close()


@router.get("/orders/{order_id}/mockup")
def order_mockup(order_id: str) -> FileResponse:
    session = get_session_factory()()
    try:
        order = get_order(session, order_id)
        if order.mockup_path is None:
            raise HTTPException(status_code=404, detail="Order mockup not available")
        return FileResponse(order.mockup_path, media_type="image/png", filename=f"{order.order_number}-mockup.png")
    finally:
        session.close()


@router.get("/orders/{order_id}/render-jobs", response_model=list[RenderJobState])
def order_render_jobs(order_id: str) -> list[RenderJobState]:
    session = get_session_factory()()
    try:
        return list_render_jobs(session, order_id)
    finally:
        session.close()


@router.post("/orders/{order_id}/render-jobs/retry", response_model=RenderJobState)
async def retry_order_render(order_id: str, request: Request) -> RenderJobState:
    settings = get_settings()
    session = get_session_factory()()
    try:
        return await retry_order_render_job(session, settings.data_dir, str(request.base_url).rstrip("/"), order_id)
    finally:
        session.close()


@router.get("/orders/{order_id}/pdf")
def order_pdf(order_id: str) -> FileResponse:
    session = get_session_factory()()
    try:
        order = get_order(session, order_id)
        if order.pdf_path is None:
            raise HTTPException(status_code=404, detail="Order PDF not available")
        return FileResponse(order.pdf_path, media_type="application/pdf", filename=f"{order.order_number}.pdf")
    finally:
        session.close()


@router.get("/orders/{order_id}/fixture")
def order_fixture(order_id: str) -> dict[str, object]:
    settings = get_settings()
    session = get_session_factory()()
    try:
        return get_order_fixture(session, settings.data_dir, order_id).model_dump()
    finally:
        session.close()


@router.post("/orders", response_model=OrderDetail)
async def create_order_from_current_draft(request: Request) -> OrderDetail:
    settings = get_settings()
    bundle = _load_current_registry_bundle(request)

    session = get_session_factory()()
    try:
        return await create_order(session, bundle, settings.data_dir, str(request.base_url).rstrip("/"))
    finally:
        session.close()


@router.patch("/drafts/current/layout", response_model=DraftState)
def patch_layout(request: Request, body: LayoutStateUpdateRequest) -> DraftState:
    session = get_session_factory()()
    try:
        settings = get_settings()
        bundle = getattr(request.app.state, "registry_bundle", None)
        if bundle is None:
            bundle = load_registry_bundle(settings.registries_dir, settings.proof_assets_dir)
        return update_layout_state(session, bundle, body)
    finally:
        session.close()


@router.get("/qr")
def qr_preview(value: str, dark: str = QR_DARK_DEFAULT, error_correction: str = "m") -> dict[str, str]:
    # `dark` lets the live preview request the template's own QR colour, so the preview and
    # the printed card agree. Defaults to the production default, so the signature stays
    # backwards compatible.
    normalized = normalize_url(value)
    return {"value": normalized, "data_url": build_qr_data_url(normalized, dark=dark, error_correction=error_correction)}


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
        bundle = load_registry_bundle(settings.registries_dir, settings.proof_assets_dir)
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
