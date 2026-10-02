"""add treatment plans table

Revision ID: d7e8f9a0b1c2
Revises: b3c9d4e1f2a6
Create Date: 2026-07-26 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d7e8f9a0b1c2"
down_revision = "b3c9d4e1f2a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "treatment_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("diagnosis", sa.String(length=2000), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'planned'")),
        sa.Column("notes", sa.String(length=2000), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "treatment_steps",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("treatment_plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("tooth", sa.String(length=50), nullable=True),
        sa.Column("est_duration_minutes", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("depends_on_step_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("requires_consent", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("consent_signed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["treatment_plan_id"], ["treatment_plans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["depends_on_step_id"], ["treatment_steps.id"], ondelete="SET NULL"),
    )


def downgrade() -> None:
    op.drop_table("treatment_steps")
    op.drop_table("treatment_plans")
