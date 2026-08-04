"""initial bootstrap schema"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "drafts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("order_number", sa.String(length=64), nullable=False, unique=True),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("product_id", sa.String(length=255), nullable=False),
        sa.Column("template_id", sa.String(length=255), nullable=False),
        sa.Column("template_version", sa.String(length=64), nullable=False),
        sa.Column("variant_id", sa.String(length=255), nullable=True),
        sa.Column("product_snapshot", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("template_snapshot", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("layout_snapshot", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("validation_snapshot", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("preview_path", sa.String(length=1024), nullable=True),
        sa.Column("mockup_path", sa.String(length=1024), nullable=True),
        sa.Column("pdf_path", sa.String(length=1024), nullable=True),
        sa.Column("render_engine_version", sa.String(length=64), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    op.create_table(
        "order_assets",
        sa.Column("order_id", sa.String(length=36), nullable=False),
        sa.Column("asset_id", sa.String(length=64), nullable=False),
        sa.Column("semantic_role", sa.String(length=255), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("order_id", "asset_id", "semantic_role"),
    )

def downgrade() -> None:
    op.drop_table("order_assets")
    op.drop_table("orders")
    op.drop_table("drafts")
