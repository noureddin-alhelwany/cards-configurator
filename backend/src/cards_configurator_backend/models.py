from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class DraftRecord(Base):
    __tablename__ = "drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.current_timestamp()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.current_timestamp()
    )


class OrderRecord(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    order_number: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    use_case_id: Mapped[str] = mapped_column(String(255), nullable=False)
    product_id: Mapped[str] = mapped_column(String(255), nullable=False)
    template_id: Mapped[str] = mapped_column(String(255), nullable=False)
    template_version: Mapped[str] = mapped_column(String(64), nullable=False)
    variant_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    use_case_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    product_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    template_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    layout_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    validation_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    preview_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    mockup_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    pdf_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    render_engine_version: Mapped[str] = mapped_column(String(64), nullable=False)
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.current_timestamp()
    )


class OrderAssetRecord(Base):
    __tablename__ = "order_assets"

    order_id: Mapped[str] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        primary_key=True,
    )
    asset_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    semantic_role: Mapped[str] = mapped_column(String(255), primary_key=True)
