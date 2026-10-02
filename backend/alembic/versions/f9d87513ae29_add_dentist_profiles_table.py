"""add dentist_profiles table

Revision ID: f9d87513ae29
Revises: 9f0820250092
Create Date: 2026-07-12 21:09:34.767011

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'f9d87513ae29'
down_revision = '9f0820250092'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dentist_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("specialty", sa.String(length=100), nullable=False),
        sa.Column("license_number", sa.String(length=50), nullable=False),
        sa.Column("bio", sa.String(length=2000), nullable=True),
        sa.Column("color", sa.String(length=20), nullable=False, server_default="#2563eb"),
        sa.Column("working_hours", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("license_number"),
    )


def downgrade() -> None:
    op.drop_table("dentist_profiles")