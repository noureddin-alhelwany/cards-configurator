from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any, Literal

from fastapi import HTTPException
from pydantic import BaseModel, ValidationError
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .drafts import get_current_draft
from .models import OrderAssetRecord, OrderRecord, RenderJobRecord
from .orders.schemas import OrderSummary
from .orders.service import list_orders
from .registries.loader import load_registry_bundle
from .registries.schemas import (
    CategoryDefinition,
    ProductDefinition,
    RegistryBundle,
    RegistryIssue,
    TemplateDefinition,
)

RegistryKind = Literal["category", "product", "template"]

_KIND_DIRECTORIES: dict[RegistryKind, str] = {
    "category": "categories",
    "product": "products",
    "template": "templates",
}


class RegistryFileSummary(BaseModel):
    kind: RegistryKind
    path: str
    id: str
    title: str
    version: str | None = None
    active: bool | None = None
    order_count: int = 0
    asset_count: int = 0
    error: str | None = None


class RegistryFileContent(BaseModel):
    kind: RegistryKind
    path: str
    content: str


class RegistryFileUpdateRequest(BaseModel):
    content: str


class AdminAssetSummary(BaseModel):
    asset_id: str
    kind: str | None = None
    original_filename: str | None = None
    mime_type: str | None = None
    sha256: str | None = None
    preview_path: str | None = None
    render_path: str | None = None
    original_path: str | None = None
    order_count: int = 0


class AdminDataResponse(BaseModel):
    registries: list[RegistryFileSummary]
    categories: list[CategoryDefinition]
    products: list[ProductDefinition]
    templates: list[TemplateDefinition]
    orders: list[OrderSummary]
    assets: list[AdminAssetSummary]
    draft: dict[str, Any]
    diagnostics: list[RegistryIssue]


def _registry_directory(registries_dir: Path, kind: RegistryKind) -> Path:
    return registries_dir / _KIND_DIRECTORIES[kind]


def _registry_path(registries_dir: Path, kind: RegistryKind, relative_path: str) -> Path:
    directory = _registry_directory(registries_dir, kind)
    candidate = (directory / relative_path).resolve()
    directory_resolved = directory.resolve()
    if directory_resolved not in candidate.parents and candidate != directory_resolved:
        raise HTTPException(status_code=400, detail="Invalid registry file path")
    if candidate.suffix != ".json":
        raise HTTPException(status_code=400, detail="Registry files must use the .json extension")
    return candidate


def _summary_title(kind: RegistryKind, payload: dict[str, Any]) -> str:
    if kind == "template":
        return str(payload.get("name") or payload.get("id") or "template")
    return str(payload.get("name") or payload.get("id") or kind)


def _summary_from_payload(
    kind: RegistryKind,
    relative_path: str,
    payload: dict[str, Any],
    *,
    order_count: int = 0,
    asset_count: int = 0,
) -> RegistryFileSummary:
    return RegistryFileSummary(
        kind=kind,
        path=relative_path,
        id=str(payload.get("id") or Path(relative_path).stem),
        title=_summary_title(kind, payload),
        version=str(payload.get("version")) if isinstance(payload.get("version"), str) else None,
        active=bool(payload.get("active")) if isinstance(payload.get("active"), bool) else None,
        order_count=order_count,
        asset_count=asset_count,
    )


def _schema_for_kind(kind: RegistryKind):
    return {
        "category": CategoryDefinition,
        "product": ProductDefinition,
        "template": TemplateDefinition,
    }[kind]


def _registry_order_counts(session: Session) -> dict[tuple[str, str], int]:
    counts: dict[tuple[str, str], int] = {}
    for record in session.scalars(select(OrderRecord)).all():
        counts[("category", record.category_id)] = counts.get(("category", record.category_id), 0) + 1
        counts[("product", record.product_id)] = counts.get(("product", record.product_id), 0) + 1
        counts[("template", f"{record.template_id}::{record.template_version}")] = counts.get(
            ("template", f"{record.template_id}::{record.template_version}"),
            0,
        ) + 1
    return counts


def _asset_counts(session: Session) -> dict[str, int]:
    counts: dict[str, int] = {}
    for record in session.scalars(select(OrderAssetRecord)).all():
        counts[record.asset_id] = counts.get(record.asset_id, 0) + 1
    return counts


def _current_draft_key(session: Session, key: str) -> str | None:
    draft = get_current_draft(session)
    payload = draft.model_dump()
    value = payload.get(key)
    return value if isinstance(value, str) else None


def _references_current_draft(session: Session, kind: RegistryKind, payload: dict[str, Any]) -> bool:
    if kind == "category":
        return _current_draft_key(session, "category_id") == payload.get("id")
    if kind == "product":
        return _current_draft_key(session, "product_id") == payload.get("id")
    return (
        _current_draft_key(session, "template_id") == payload.get("id")
        and _current_draft_key(session, "template_version") == payload.get("version")
    )


def list_registry_files(registries_dir: Path, session: Session | None = None) -> list[RegistryFileSummary]:
    summaries: list[RegistryFileSummary] = []
    order_counts = _registry_order_counts(session) if session is not None else {}
    asset_counts = _asset_counts(session) if session is not None else {}

    for kind in ("category", "product", "template"):
        directory = _registry_directory(registries_dir, kind)
        if not directory.exists():
            continue

        for path in sorted(directory.rglob("*.json")):
            relative_path = path.relative_to(directory).as_posix()
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
                if not isinstance(payload, dict):
                    raise TypeError("registry files must contain an object")
                _schema_for_kind(kind).model_validate(payload)
                key = (kind, payload.get("id") if kind != "template" else f"{payload.get('id')}::{payload.get('version')}")
                summary = _summary_from_payload(
                    kind,
                    relative_path,
                    payload,
                    order_count=order_counts.get(key, 0),
                    asset_count=asset_counts.get(str(payload.get("id")), 0),
                )
            except (json.JSONDecodeError, TypeError, ValidationError) as exc:
                summary = RegistryFileSummary(
                    kind=kind,
                    path=relative_path,
                    id=path.stem,
                    title=path.stem,
                    error=str(exc),
                )
            summaries.append(summary)

    return summaries


def _asset_summaries(data_dir: Path, session: Session) -> list[AdminAssetSummary]:
    summaries: list[AdminAssetSummary] = []
    asset_counts = _asset_counts(session)

    assets_dir = data_dir / "assets"
    if not assets_dir.exists():
        return summaries

    for metadata_path in sorted(assets_dir.glob("*/metadata.json")):
        asset_id = metadata_path.parent.name
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            if not isinstance(metadata, dict):
                raise TypeError("asset metadata must contain an object")
        except (json.JSONDecodeError, TypeError, OSError) as exc:
            summaries.append(
                AdminAssetSummary(
                    asset_id=asset_id,
                    order_count=asset_counts.get(asset_id, 0),
                    error=str(exc),
                )
            )
            continue
        summaries.append(
            AdminAssetSummary(
                asset_id=asset_id,
                kind=str(metadata.get("kind")) if isinstance(metadata.get("kind"), str) else None,
                original_filename=str(metadata.get("original_filename"))
                if isinstance(metadata.get("original_filename"), str)
                else None,
                mime_type=str(metadata.get("mime_type")) if isinstance(metadata.get("mime_type"), str) else None,
                sha256=str(metadata.get("sha256")) if isinstance(metadata.get("sha256"), str) else None,
                preview_path=str(metadata.get("preview_path")) if isinstance(metadata.get("preview_path"), str) else None,
                render_path=str(metadata.get("render_path")) if isinstance(metadata.get("render_path"), str) else None,
                original_path=str(metadata.get("original_path")) if isinstance(metadata.get("original_path"), str) else None,
                order_count=asset_counts.get(asset_id, 0),
            )
        )
    return summaries


def load_admin_data(registries_dir: Path, proof_assets_dir: Path, data_dir: Path, session: Session) -> AdminDataResponse:
    bundle = load_registry_bundle(registries_dir, proof_assets_dir)
    return AdminDataResponse(
        registries=list_registry_files(registries_dir, session=session),
        categories=bundle.categories,
        products=bundle.products,
        templates=bundle.templates,
        orders=list_orders(session),
        assets=_asset_summaries(data_dir, session),
        draft=get_current_draft(session).model_dump(),
        diagnostics=bundle.diagnostics,
    )


def read_registry_file(registries_dir: Path, kind: RegistryKind, relative_path: str) -> RegistryFileContent:
    path = _registry_path(registries_dir, kind, relative_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Registry file not found")
    return RegistryFileContent(kind=kind, path=relative_path, content=path.read_text(encoding="utf-8"))


def _validate_registry_bundle(
    registries_dir: Path,
    proof_assets_dir: Path,
    *,
    allow_blocking: bool = False,
) -> RegistryBundle:
    bundle = load_registry_bundle(registries_dir, proof_assets_dir)
    if not allow_blocking and any(issue.blocking for issue in bundle.diagnostics):
        messages = "; ".join(issue.message for issue in bundle.diagnostics if issue.blocking)
        raise HTTPException(status_code=400, detail=f"Registry validation failed: {messages}")
    return bundle


def write_registry_file(
    registries_dir: Path,
    proof_assets_dir: Path,
    kind: RegistryKind,
    relative_path: str,
    content: str,
) -> RegistryFileContent:
    path = _registry_path(registries_dir, kind, relative_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    original = path.read_text(encoding="utf-8") if path.exists() else None
    path.write_text(content, encoding="utf-8")

    try:
        _validate_registry_bundle(registries_dir, proof_assets_dir)
    except HTTPException as exc:
        if original is None:
            path.unlink(missing_ok=True)
        else:
            path.write_text(original, encoding="utf-8")
        raise HTTPException(status_code=400, detail=f"Registry file validation failed: {exc.detail}") from exc

    return RegistryFileContent(kind=kind, path=relative_path, content=path.read_text(encoding="utf-8"))


def delete_registry_file(
    session: Session,
    registries_dir: Path,
    proof_assets_dir: Path,
    kind: RegistryKind,
    relative_path: str,
) -> None:
    path = _registry_path(registries_dir, kind, relative_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Registry file not found")

    original = path.read_text(encoding="utf-8")
    payload: dict[str, Any] | None = None
    try:
        loaded = json.loads(original)
        if isinstance(loaded, dict):
            payload = loaded
    except json.JSONDecodeError:
        payload = None

    if payload is not None:
        if _references_current_draft(session, kind, payload):
            raise HTTPException(status_code=409, detail="Registry file is still used by the current draft")
        order_counts = _registry_order_counts(session)
        key = (kind, payload.get("id") if kind != "template" else f"{payload.get('id')}::{payload.get('version')}")
        if order_counts.get(key, 0) > 0:
            raise HTTPException(status_code=409, detail="Registry file is still referenced by orders")

    path.unlink()
    try:
        _validate_registry_bundle(registries_dir, proof_assets_dir)
    except HTTPException as exc:
        path.write_text(original, encoding="utf-8")
        raise HTTPException(status_code=400, detail=f"Registry file deletion would break validation: {exc.detail}") from exc


def delete_order(session: Session, data_dir: Path, order_id: str) -> None:
    order = session.get(OrderRecord, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    order_dir = data_dir / "orders" / order.id
    session.execute(delete(RenderJobRecord).where(RenderJobRecord.order_id == order.id))
    session.execute(delete(OrderAssetRecord).where(OrderAssetRecord.order_id == order.id))
    session.delete(order)
    session.commit()
    shutil.rmtree(order_dir, ignore_errors=True)


def delete_asset(session: Session, data_dir: Path, asset_id: str) -> None:
    if session.scalar(select(OrderAssetRecord).where(OrderAssetRecord.asset_id == asset_id)) is not None:
        raise HTTPException(status_code=409, detail="Asset is still referenced by an order")

    asset_dir = data_dir / "assets" / asset_id
    if not asset_dir.exists():
        raise HTTPException(status_code=404, detail="Asset not found")
    shutil.rmtree(asset_dir)
