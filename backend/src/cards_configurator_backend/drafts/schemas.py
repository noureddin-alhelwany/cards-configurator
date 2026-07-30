from __future__ import annotations

from pydantic import BaseModel, Field

from ..registries.schemas import ElementAdjustment, LayoutState


class TemplateSelectionRequest(BaseModel):
    use_case_id: str
    product_id: str
    template_id: str
    template_version: str
    variant_id: str | None = None


class LayoutStateUpdateRequest(BaseModel):
    variant_id: str | None = None
    text_values: dict[str, str] | None = None
    asset_values: dict[str, str] | None = None
    element_adjustments: dict[str, ElementAdjustment] | None = None


class DraftState(BaseModel):
    id: int
    name: str
    use_case_id: str | None = None
    product_id: str | None = None
    template_id: str | None = None
    template_version: str | None = None
    variant_id: str | None = None
    layout_state: LayoutState = Field(
        default_factory=lambda: LayoutState(variant_id="", element_adjustments={}, text_values={}, asset_values={})
    )
