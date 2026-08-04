from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class OrderAssetState(BaseModel):
    order_id: str
    asset_id: str
    semantic_role: str


class OrderSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    id: str
    order_number: str
    display_name: str | None = None
    category_id: str
    product_id: str
    template_id: str
    template_version: str
    variant_id: str | None = None
    approved_at: datetime
    created_at: datetime
    preview_path: str | None = None


class OrderDetail(OrderSummary):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    category_snapshot: dict[str, object] = Field(default_factory=dict)
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


class RenderJobState(BaseModel):
    id: str
    order_id: str
    kind: str
    status: Literal["pending", "processing", "completed", "failed"]
    attempts: int
    error_code: str | None = None
    error_message: str | None = None
    output_path: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
