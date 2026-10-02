"""add appointment series support

Revision ID: a6d4f3c2b1e9
Revises: 7f3a2d1c0b4e
Create Date: 2026-07-26 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a6d4f3c2b1e9"
down_revision = "7f3a2d1c0b4e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "appointment_series",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("dentist_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("care_type_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("resource_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("frequency", sa.String(length=20), nullable=False),
        sa.Column("occurrence_count", sa.Integer(), nullable=True),
        sa.Column("until", sa.Date(), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("send_confirmation", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("prep_notes", sa.String(length=2000), nullable=True),
        sa.Column("internal_notes", sa.String(length=2000), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["dentist_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["care_type_id"], ["care_types.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
    )

    op.add_column(
        "appointments",
        sa.Column("series_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "appointments",
        sa.Column("series_occurrence_index", sa.Integer(), nullable=True),
    )

    op.create_foreign_key(
        "fk_appointments_series_id_appointment_series",
        "appointments",
        "appointment_series",
        ["series_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_appointments_series_id_appointment_series", "appointments", type_="foreignkey")
    op.drop_column("appointments", "series_occurrence_index")
    op.drop_column("appointments", "series_id")
    op.drop_table("appointment_series")
