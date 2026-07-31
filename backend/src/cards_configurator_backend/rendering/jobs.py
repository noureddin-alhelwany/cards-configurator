from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, cast
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..assets import load_asset
from ..models import OrderAssetRecord, OrderRecord, RenderJobRecord
from ..registries.schemas import AssetDataUrl, LayoutState, TemplateDefinition
from .service import render_order_artifacts
from ..orders.schemas import RenderJobState

RenderJobStatus = Literal["pending", "processing", "completed", "failed"]


def _order_assets(session: Session, order_id: str) -> list[OrderAssetRecord]:
    return list(session.scalars(select(OrderAssetRecord).where(OrderAssetRecord.order_id == order_id)).all())


def load_order_assets_from_storage(data_dir: Path, session: Session, order_id: str) -> dict[str, AssetDataUrl]:
    assets: dict[str, AssetDataUrl] = {}
    for asset in _order_assets(session, order_id):
        asset_data = load_asset(data_dir, asset.asset_id)
        data_url = asset_data.get("render_data_url") or asset_data.get("preview_data_url")
        mime_type = asset_data.get("mime_type")
        if not isinstance(data_url, str) or not isinstance(mime_type, str):
            raise HTTPException(status_code=500, detail="Stored asset metadata is incomplete")
        assets[asset.semantic_role] = AssetDataUrl(mime_type=mime_type, data_url=data_url)
    return assets


def _render_job_from_record(record: RenderJobRecord) -> RenderJobState:
    return RenderJobState(
        id=record.id,
        order_id=record.order_id,
        kind=record.kind,
        status=cast(RenderJobStatus, record.status),
        attempts=record.attempts,
        error_code=record.error_code,
        error_message=record.error_message,
        output_path=record.output_path,
        started_at=record.started_at,
        completed_at=record.completed_at,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


def _render_job_query(session: Session, order_id: str, kind: str = "production") -> RenderJobRecord | None:
    return session.scalar(
        select(RenderJobRecord).where(RenderJobRecord.order_id == order_id, RenderJobRecord.kind == kind)
    )


def _create_or_load_render_job(session: Session, order_id: str, kind: str = "production") -> RenderJobRecord:
    record = _render_job_query(session, order_id, kind)
    if record is not None:
        return record
    record = RenderJobRecord(
        id=uuid4().hex,
        order_id=order_id,
        kind=kind,
        status="pending",
        attempts=0,
        error_code=None,
        error_message=None,
        output_path=None,
        started_at=None,
        completed_at=None,
    )
    session.add(record)
    session.flush()
    return record


def list_render_jobs(session: Session, order_id: str) -> list[RenderJobState]:
    if session.get(OrderRecord, order_id) is None:
        raise HTTPException(status_code=404, detail="Order not found")
    records = session.scalars(
        select(RenderJobRecord)
        .where(RenderJobRecord.order_id == order_id)
        .order_by(RenderJobRecord.created_at.asc(), RenderJobRecord.id.asc())
    ).all()
    return [_render_job_from_record(record) for record in records]


async def _render_order_job(
    session: Session,
    *,
    order: OrderRecord,
    template: TemplateDefinition,
    layout_state: LayoutState,
    assets: dict[str, AssetDataUrl],
    base_url: str,
    data_dir: Path,
    kind: str = "production",
) -> RenderJobState:
    job = _create_or_load_render_job(session, order.id, kind)
    job.attempts += 1
    job.status = "processing"
    job.error_code = None
    job.error_message = None
    job.started_at = datetime.now(timezone.utc)
    job.completed_at = None

    attempt_dir = data_dir / "orders" / order.id / "render-jobs" / job.id / f"attempt-{job.attempts}"
    job.output_path = str(attempt_dir)
    session.add(job)
    session.commit()
    session.refresh(job)

    try:
        artifacts = await render_order_artifacts(
            page_url=f"{base_url}/render/orders/{order.id}/production",
            template=template,
            layout_state=layout_state,
            assets=assets,
            output_dir=attempt_dir,
        )
    except Exception as exc:  # noqa: BLE001
        job.status = "failed"
        job.error_code = "render_failed"
        job.error_message = str(exc)
        job.completed_at = datetime.now(timezone.utc)
        session.add(job)
        session.commit()
        session.refresh(job)
        raise HTTPException(status_code=500, detail="Order rendering failed") from exc

    order.preview_path = artifacts.preview_path
    order.mockup_path = artifacts.preview_path
    order.pdf_path = artifacts.pdf_path
    job.status = "completed"
    job.error_code = None
    job.error_message = None
    job.completed_at = datetime.now(timezone.utc)
    session.add(order)
    session.add(job)
    session.commit()
    session.refresh(order)
    session.refresh(job)
    return _render_job_from_record(job)


async def render_order_job(
    session: Session,
    *,
    order: OrderRecord,
    template: TemplateDefinition,
    layout_state: LayoutState,
    assets: dict[str, AssetDataUrl],
    base_url: str,
    data_dir: Path,
) -> RenderJobState:
    return await _render_order_job(
        session,
        order=order,
        template=template,
        layout_state=layout_state,
        assets=assets,
        base_url=base_url,
        data_dir=data_dir,
    )


async def retry_order_render_job(session: Session, data_dir: Path, base_url: str, order_id: str) -> RenderJobState:
    order = session.get(OrderRecord, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    template = TemplateDefinition.model_validate(order.template_snapshot)
    layout_state = LayoutState.model_validate(order.layout_snapshot)
    assets = load_order_assets_from_storage(data_dir, session, order.id)

    return await _render_order_job(
        session,
        order=order,
        template=template,
        layout_state=layout_state,
        assets=assets,
        base_url=base_url,
        data_dir=data_dir,
    )
