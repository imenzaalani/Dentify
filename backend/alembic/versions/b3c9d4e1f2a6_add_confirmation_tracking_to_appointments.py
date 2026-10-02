"""add confirmation tracking to appointments

Revision ID: b3c9d4e1f2a6
Revises: a6d4f3c2b1e9
Create Date: 2026-07-26 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "b3c9d4e1f2a6"
down_revision = "a6d4f3c2b1e9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "appointments",
        sa.Column("confirmation_delivery_status", sa.String(length=20), nullable=False, server_default="not_requested"),
    )
    op.add_column(
        "appointments",
        sa.Column("confirmation_sent_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("appointments", "confirmation_sent_at")
    op.drop_column("appointments", "confirmation_delivery_status")
