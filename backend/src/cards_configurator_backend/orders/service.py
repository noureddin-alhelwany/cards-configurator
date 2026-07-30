from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..assets import load_asset
from ..drafts import get_current_draft
from ..models import OrderAssetRecord, OrderRecord
from ..quality import QualityReport, validate_current_draft
from ..registries.loader import RegistryBundle
from ..registries.schemas import (
    AssetDataUrl,
    LayoutState,
    ProductDefinition,
    ProofFixture,
    TemplateDefinition,
    UseCaseDefinition,
)
from ..rendering.service import render_order_artifacts
from ..urls import build_qr_data_url
from .schemas import OrderAssetState, OrderDetail, OrderSummary

ORDER_RENDER_ENGINE_VERSION = "1"


def _find_template(bundle: RegistryBundle, template_id: str, template_version: str) -> TemplateDefinition | None:
    return next(
        (
            template
            for template in bundle.templates
            if template.active and template.id == template_id and template.version == template_version
        ),
        None,
    )


def _find_product(bundle: RegistryBundle, product_id: str) -> ProductDefinition | None:
    return next((product for product in bundle.products if product.active and product.id == product_id), None)


def _find_use_case(bundle: RegistryBundle, use_case_id: str) -> UseCaseDefinition | None:
    return next((use_case for use_case in bundle.use_cases if use_case.active and use_case.id == use_case_id), None)


def _order_assets(session: Session, order_id: str) -> list[OrderAssetRecord]:
    return list(session.scalars(select(OrderAssetRecord).where(OrderAssetRecord.order_id == order_id)).all())


def _order_summary_from_record(record: OrderRecord) -> OrderSummary:
    return OrderSummary(
        id=record.id,
        order_number=record.order_number,
        display_name=record.display_name,
        use_case_id=record.use_case_id,
        product_id=record.product_id,
        template_id=record.template_id,
        template_version=record.template_version,
        variant_id=record.variant_id,
        approved_at=record.approved_at,
        created_at=record.created_at,
        preview_path=record.preview_path,
    )


def _order_detail_from_record(session: Session, record: OrderRecord) -> OrderDetail:
    return OrderDetail(
        **_order_summary_from_record(record).model_dump(),
        use_case_snapshot=record.use_case_snapshot,
        product_snapshot=record.product_snapshot,
        template_snapshot=record.template_snapshot,
        layout_snapshot=record.layout_snapshot,
        validation_snapshot=record.validation_snapshot,
        mockup_path=record.mockup_path,
        pdf_path=record.pdf_path,
        render_engine_version=record.render_engine_version,
        assets=[
            OrderAssetState(order_id=asset.order_id, asset_id=asset.asset_id, semantic_role=asset.semantic_role)
            for asset in _order_assets(session, record.id)
        ],
    )


def list_orders(session: Session) -> list[OrderSummary]:
    records = session.scalars(select(OrderRecord).order_by(OrderRecord.created_at.desc(), OrderRecord.id.desc())).all()
    return [_order_summary_from_record(record) for record in records]


def get_order(session: Session, order_id: str) -> OrderDetail:
    record = session.get(OrderRecord, order_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_detail_from_record(session, record)


def _order_assets_from_storage(data_dir: Path, session: Session, order_id: str) -> dict[str, AssetDataUrl]:
    assets: dict[str, AssetDataUrl] = {}
    for asset in _order_assets(session, order_id):
        asset_data = load_asset(data_dir, asset.asset_id)
        data_url = asset_data.get("render_data_url") or asset_data.get("preview_data_url")
        mime_type = asset_data.get("mime_type")
        if not isinstance(data_url, str) or not isinstance(mime_type, str):
            raise HTTPException(status_code=500, detail="Stored asset metadata is incomplete")
        assets[asset.semantic_role] = AssetDataUrl(mime_type=mime_type, data_url=data_url)
    return assets


def get_order_fixture(session: Session, data_dir: Path, order_id: str) -> ProofFixture:
    record = session.get(OrderRecord, order_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Order not found")

    template = TemplateDefinition.model_validate(record.template_snapshot)
    product = ProductDefinition.model_validate(record.product_snapshot)
    use_case = UseCaseDefinition.model_validate(record.use_case_snapshot)
    layout_state = LayoutState.model_validate(record.layout_snapshot)
    assets = _order_assets_from_storage(data_dir, session, record.id)
    qr_field = next((field for field in template.fields if field.type == "url"), None)
    qr_value = layout_state.text_values.get(qr_field.id, "") if qr_field is not None else ""
    if not qr_value:
        qr_element = next((element for element in template.elements if element.kind == "qr"), None)
        qr_value = qr_element.value if qr_element is not None else ""
    if qr_value:
        assets["qr"] = AssetDataUrl(mime_type="image/svg+xml", data_url=build_qr_data_url(qr_value))
    return ProofFixture(template=template, product=product, use_case=use_case, layout_state=layout_state, assets=assets)


async def create_order(
    session: Session,
    bundle: RegistryBundle,
    data_dir: Path,
    base_url: str,
) -> OrderDetail:
    draft = get_current_draft(session)
    if draft.approved_at is None:
        raise HTTPException(status_code=409, detail="Draft must be approved before creating an order")

    validation_report: QualityReport = validate_current_draft(data_dir, bundle, draft)
    if validation_report.blocking:
        raise HTTPException(status_code=400, detail="Blocking issues must be resolved before creating an order")

    template = _find_template(bundle, draft.template_id or "", draft.template_version or "")
    product = _find_product(bundle, draft.product_id or "")
    use_case = _find_use_case(bundle, draft.use_case_id or "")
    if template is None or product is None or use_case is None:
        raise HTTPException(status_code=400, detail="Draft references an unknown registry entry")

    order_id = uuid4().hex
    order_number = f"ORD-{datetime.now(timezone.utc):%Y%m%d}-{uuid4().hex[:6].upper()}"
    approved_at = datetime.fromisoformat(draft.approved_at)
    record = OrderRecord(
        id=order_id,
        order_number=order_number,
        display_name=None,
        use_case_id=use_case.id,
        product_id=product.id,
        template_id=template.id,
        template_version=template.version,
        variant_id=draft.variant_id,
        use_case_snapshot=use_case.model_dump(),
        product_snapshot=product.model_dump(),
        template_snapshot=template.model_dump(),
        layout_snapshot=draft.layout_state.model_dump(),
        validation_snapshot=validation_report.model_dump(),
        preview_path=None,
        mockup_path=None,
        pdf_path=None,
        render_engine_version=ORDER_RENDER_ENGINE_VERSION,
        approved_at=approved_at,
    )
    session.add(record)
    session.flush()

    for semantic_role, asset_id in draft.layout_state.asset_values.items():
        if not asset_id or asset_id.startswith("data:"):
            continue
        load_asset(data_dir, asset_id)
        session.add(OrderAssetRecord(order_id=record.id, asset_id=asset_id, semantic_role=semantic_role))

    session.commit()
    session.refresh(record)

    output_dir = data_dir / "orders" / record.id
    artifacts = await render_order_artifacts(
        page_url=f"{base_url}/render/orders/{record.id}/production",
        template=template,
        layout_state=draft.layout_state,
        assets=_order_assets_from_storage(data_dir, session, record.id),
        output_dir=output_dir,
    )
    record.preview_path = artifacts.preview_path
    record.mockup_path = artifacts.preview_path
    record.pdf_path = artifacts.pdf_path
    session.add(record)
    session.commit()
    session.refresh(record)
    return _order_detail_from_record(session, record)
