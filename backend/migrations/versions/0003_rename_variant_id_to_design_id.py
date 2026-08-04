"""rename order variant_id to design_id

Revision ID: 0003_rename_variant_id_to_design_id
Revises: 0002_render_jobs
Create Date: 2026-08-04 00:00:00.000000
"""

from __future__ import annotations

from alembic import op

revision = "0003_rename_variant_id_to_design_id"
down_revision = "0002_render_jobs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.alter_column("variant_id", new_column_name="design_id")


def downgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.alter_column("design_id", new_column_name="variant_id")
