"""add users.invited_by_patient_id

Revision ID: 004
Revises: 003
Create Date: 2026-07-10 00:05:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("invited_by_patient_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "users_invited_by_patient_id_fkey",
        "users", "patients",
        ["invited_by_patient_id"], ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("users_invited_by_patient_id_fkey", "users", type_="foreignkey")
    op.drop_column("users", "invited_by_patient_id")