from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import DraftRecord
from ..registries.loader import RegistryBundle
from ..registries.schemas import (
    ElementAdjustment,
    ImageElementDefinition,
    LayoutState,
    TemplateDefinition,
)
from ..urls import normalize_url
from .schemas import (
    ApprovalRequest,
    DraftState,
    LayoutStateUpdateRequest,
    TemplateSelectionRequest,
)

DEFAULT_DRAFT_NAME = "Current draft"


def _empty_layout_state(variant_id: str = "") -> LayoutState:
    return LayoutState(variant_id=variant_id, element_adjustments={}, text_values={}, asset_values={})


def _default_payload() -> dict[str, object]:
    return {
        "use_case_id": None,
        "product_id": None,
        "template_id": None,
        "template_version": None,
        "variant_id": None,
        "layout_state": _empty_layout_state().model_dump(),
    }


def _draft_state_from_record(record: DraftRecord) -> DraftState:
    payload = record.payload or {}
    layout_payload = payload.get("layout_state")
    if not isinstance(layout_payload, dict):
        layout_payload = _empty_layout_state().model_dump()

    return DraftState(
        id=record.id,
        name=record.name,
        updated_at=record.updated_at.isoformat() if record.updated_at else None,
        use_case_id=payload.get("use_case_id") if isinstance(payload.get("use_case_id"), str) else None,
        product_id=payload.get("product_id") if isinstance(payload.get("product_id"), str) else None,
        template_id=payload.get("template_id") if isinstance(payload.get("template_id"), str) else None,
        template_version=payload.get("template_version")
        if isinstance(payload.get("template_version"), str)
        else None,
        variant_id=payload.get("variant_id") if isinstance(payload.get("variant_id"), str) else None,
        approved_at=payload.get("approved_at") if isinstance(payload.get("approved_at"), str) else None,
        approval_snapshot=payload.get("approval_snapshot") if isinstance(payload.get("approval_snapshot"), dict) else None,
        approval_checklist=payload.get("approval_checklist")
        if isinstance(payload.get("approval_checklist"), dict)
        else None,
        layout_state=LayoutState.model_validate(layout_payload),
    )


def _get_first_draft(session: Session) -> DraftRecord | None:
    return session.scalar(select(DraftRecord).order_by(DraftRecord.id.asc()))


def _is_locked(payload: dict[str, object]) -> bool:
    return isinstance(payload.get("approved_at"), str)


def _assert_draft_is_editable(payload: dict[str, object]) -> None:
    if _is_locked(payload):
        raise HTTPException(status_code=409, detail="Draft has been approved and is locked")


def get_current_draft(session: Session) -> DraftState:
    draft = _get_first_draft(session)
    if draft is None:
        draft = DraftRecord(name=DEFAULT_DRAFT_NAME, payload=_default_payload())
        session.add(draft)
        session.commit()
        session.refresh(draft)
    return _draft_state_from_record(draft)


def reset_current_draft(session: Session) -> DraftState:
    draft = _get_first_draft(session)
    if draft is None:
        draft = DraftRecord(name=DEFAULT_DRAFT_NAME, payload=_default_payload())
        session.add(draft)
        session.flush()

    draft.payload = _default_payload()
    draft.updated_at = datetime.now(timezone.utc)
    session.commit()
    session.refresh(draft)
    return _draft_state_from_record(draft)


def _find_template(bundle: RegistryBundle, template_id: str, template_version: str) -> TemplateDefinition | None:
    return next(
        (
            template
            for template in bundle.templates
            if template.active and template.id == template_id and template.version == template_version
        ),
        None,
    )


def _clamp_element_adjustments(
    template: TemplateDefinition | None,
    adjustments: dict[str, ElementAdjustment],
) -> dict[str, ElementAdjustment]:
    """Store only adjustments the renderer can actually apply.

    This used to be a blind `dict.update`. The browser clamps before saving and the renderer
    clamps before drawing, but a direct PATCH persisted anything -- and then the quality gate
    computed the effective DPI from the stored value while the card was drawn with the clamped
    one, so validator and renderer disagreed and the DPI gate could be defeated.

    Offsets are normalised to [-1, 1] per `docs/TEMPLATE_AND_RENDERING.md`; scale is clamped to
    the element's declared range. Adjustments for unknown elements are dropped rather than
    accumulated as stale keys.
    """
    if template is None:
        return {}

    image_elements = {
        element.id: element for element in template.elements if isinstance(element, ImageElementDefinition)
    }
    clamped: dict[str, ElementAdjustment] = {}
    for element_id, adjustment in adjustments.items():
        element = image_elements.get(element_id)
        if element is None:
            continue
        clamped[element_id] = ElementAdjustment(
            offset_x=min(1.0, max(-1.0, adjustment.offset_x)),
            offset_y=min(1.0, max(-1.0, adjustment.offset_y)),
            scale=min(element.max_scale, max(element.min_scale, adjustment.scale)),
        )
    return clamped


def _normalize_layout_text_values(template: TemplateDefinition, text_values: dict[str, str]) -> dict[str, str]:
    normalized_values = dict(text_values)
    for field in template.fields:
        if field.type != "url":
            continue
        raw_value = normalized_values.get(field.id)
        if raw_value is None:
            continue
        try:
            normalized_values[field.id] = normalize_url(raw_value)
        except ValueError as exception:
            raise HTTPException(status_code=400, detail=f"Invalid URL for field {field.id}: {exception}") from exception
    return normalized_values


def save_template_selection(session: Session, bundle: RegistryBundle, request: TemplateSelectionRequest) -> DraftState:
    template = _find_template(bundle, request.template_id, request.template_version)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    if request.product_id != template.product_id:
        raise HTTPException(status_code=400, detail="Template does not belong to the selected product")
    if request.use_case_id not in template.use_case_ids:
        raise HTTPException(status_code=400, detail="Template does not support the selected use case")

    variant_id = request.variant_id
    active_variants = [variant for variant in template.variants if variant.active]
    if variant_id is None:
        variant_id = active_variants[0].id if active_variants else ""
    elif variant_id not in {variant.id for variant in active_variants}:
        raise HTTPException(status_code=400, detail="Template variant is not active")

    draft = _get_first_draft(session)
    if draft is None:
        draft = DraftRecord(name=DEFAULT_DRAFT_NAME, payload=_default_payload())
        session.add(draft)
        session.flush()

    payload = dict(draft.payload or {})
    _assert_draft_is_editable(payload)

    draft.payload = {
        "use_case_id": request.use_case_id,
        "product_id": request.product_id,
        "template_id": template.id,
        "template_version": template.version,
        "variant_id": variant_id or None,
        "layout_state": _empty_layout_state(variant_id=variant_id).model_dump(),
    }
    draft.updated_at = datetime.now(timezone.utc)
    session.commit()
    session.refresh(draft)
    return _draft_state_from_record(draft)


def update_layout_state(session: Session, bundle: RegistryBundle, request: LayoutStateUpdateRequest) -> DraftState:
    draft = _get_first_draft(session)
    if draft is None:
        draft = DraftRecord(name=DEFAULT_DRAFT_NAME, payload=_default_payload())
        session.add(draft)
        session.flush()

    payload = dict(draft.payload or {})
    _assert_draft_is_editable(payload)
    layout_payload = payload.get("layout_state")
    if not isinstance(layout_payload, dict):
        layout_payload = _empty_layout_state().model_dump()
    layout_state = LayoutState.model_validate(layout_payload)

    template_payload = payload
    template = None
    template_id = template_payload.get("template_id")
    template_version = template_payload.get("template_version")
    if isinstance(template_id, str) and isinstance(template_version, str):
        template = _find_template(bundle, template_id, template_version)

    if request.variant_id is not None:
        layout_state.variant_id = request.variant_id
        payload["variant_id"] = request.variant_id
    if request.text_values is not None:
        layout_state.text_values.update(request.text_values)
        if template is not None:
            layout_state.text_values = _normalize_layout_text_values(template, layout_state.text_values)
    if request.asset_values is not None:
        layout_state.asset_values.update(request.asset_values)
    if request.element_adjustments is not None:
        layout_state.element_adjustments.update(
            _clamp_element_adjustments(template, request.element_adjustments)
        )

    payload["layout_state"] = layout_state.model_dump()
    draft.payload = payload
    draft.updated_at = datetime.now(timezone.utc)
    session.commit()
    session.refresh(draft)
    return _draft_state_from_record(draft)


def approve_draft(session: Session, bundle: RegistryBundle, request: ApprovalRequest) -> DraftState:
    draft = _get_first_draft(session)
    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")

    payload = dict(draft.payload or {})
    _assert_draft_is_editable(payload)

    checklist = request.model_dump()
    if not all(checklist.values()):
        raise HTTPException(status_code=400, detail="Approval checklist is incomplete")

    current_state = _draft_state_from_record(draft)
    template = None
    if current_state.template_id and current_state.template_version:
        template = _find_template(bundle, current_state.template_id, current_state.template_version)
    if template is None:
        raise HTTPException(status_code=400, detail="A template must be selected before approval")

    payload["approved_at"] = datetime.now(timezone.utc).isoformat()
    payload["approval_checklist"] = checklist
    payload["approval_snapshot"] = {
        "template_id": current_state.template_id,
        "template_version": current_state.template_version,
        "variant_id": current_state.variant_id,
        "layout_state": current_state.layout_state.model_dump(),
    }
    draft.payload = payload
    draft.updated_at = datetime.now(timezone.utc)
    session.commit()
    session.refresh(draft)
    return _draft_state_from_record(draft)
