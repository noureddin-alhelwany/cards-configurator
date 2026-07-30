from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class OrderAssetState(BaseModel):
    order_id: str
    asset_id: str
    semantic_role: str


class OrderSummary(BaseModel):
    id: str
    order_number: str
    display_name: str | None = None
    use_case_id: str
    product_id: str
    template_id: str
    template_version: str
    variant_id: str | None = None
    approved_at: datetime
    created_at: datetime
    preview_path: str | None = None


class OrderDetail(OrderSummary):
    use_case_snapshot: dict[str, object] = Field(default_factory=dict)
    product_snapshot: dict[str, object] = Field(default_factory=dict)
    template_snapshot: dict[str, object] = Field(default_factory=dict)
    layout_snapshot: dict[str, object] = Field(default_factory=dict)
    validation_snapshot: dict[str, object] = Field(default_factory=dict)
    mockup_path: str | None = None
    pdf_path: str | None = None
    render_engine_version: str
    assets: list[OrderAssetState] = Field(default_factory=list)


class OrderCreationRequest(BaseModel):
    display_name: str | None = None
