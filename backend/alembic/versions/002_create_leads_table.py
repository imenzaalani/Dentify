"""create leads table

Revision ID: 002
Revises: 001
Create Date: 2026-07-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("requested_service", sa.String(length=255), nullable=False),
        sa.Column("requested_datetime", sa.String(length=50), nullable=False),

        sa.Column("booking_for", sa.String(length=20), nullable=False),

        sa.Column("patient_first_name", sa.String(length=255), nullable=False),
        sa.Column("patient_last_name", sa.String(length=255), nullable=False),
        sa.Column("patient_legal_sex", sa.String(length=50), nullable=True),
        sa.Column("patient_dob", sa.String(length=50), nullable=False),
        sa.Column("patient_zip", sa.String(length=30), nullable=True),

        sa.Column("contact_email", sa.String(length=255), nullable=False),
        sa.Column("contact_phone", sa.String(length=50), nullable=False),
        sa.Column("sms_consent", sa.Boolean(), nullable=False, server_default=sa.false()),

        sa.Column("comments", sa.String(length=2000), nullable=True),
        sa.Column("hear_about_us", sa.String(length=50), nullable=True),

        sa.Column("source", sa.String(length=50), nullable=False, server_default=sa.text("'online_form'")),
        sa.Column("status", sa.String(length=30), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("notes", sa.String(length=2000), nullable=True),
        sa.Column("converted_to_patient_id", postgresql.UUID(as_uuid=True), nullable=True),

        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["converted_to_patient_id"], ["users.id"], ondelete="SET NULL"),
    )


def downgrade() -> None:
    op.drop_table("leads")
