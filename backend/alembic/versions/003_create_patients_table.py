"""create patients table, repoint leads.converted_to_patient_id

Revision ID: 003
Revises: 002
Create Date: 2026-07-10 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SEQUENCE patients_patient_number_seq")

    op.create_table(
        "patients",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "patient_number", sa.String(length=20), nullable=False,
            server_default=sa.text("'PAT-' || lpad(nextval('patients_patient_number_seq')::text, 6, '0')"),
        ),
        sa.Column("first_name", sa.String(length=255), nullable=False),
        sa.Column("last_name", sa.String(length=255), nullable=False),
        sa.Column("dob", sa.String(length=50), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("legal_sex", sa.String(length=50), nullable=True),
        sa.Column("zip_code", sa.String(length=30), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("primary_contact_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("preferred_contact_method", sa.String(length=20), nullable=True),
        sa.Column("lifecycle_stage", sa.String(length=30), nullable=False, server_default=sa.text("'new'")),
        sa.Column("created_via", sa.String(length=50), nullable=False, server_default=sa.text("'online_form'")),
        sa.Column("allergies", postgresql.ARRAY(sa.String(length=255)), nullable=True),
        sa.Column("medical_history", sa.String(length=4000), nullable=True),
        sa.Column("current_medications", sa.String(length=2000), nullable=True),
        sa.Column("emergency_contact_name", sa.String(length=255), nullable=True),
        sa.Column("emergency_contact_phone", sa.String(length=50), nullable=True),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("archived_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("archived_reason", sa.String(length=255), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("patient_number"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["primary_contact_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["archived_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
    )

    op.execute("ALTER SEQUENCE patients_patient_number_seq OWNED BY patients.patient_number")

    # leads.converted_to_patient_id was originally FK'd to users.id, before
    # a dedicated patients table existed. Repoint it now that one does.
    op.drop_constraint("leads_converted_to_patient_id_fkey", "leads", type_="foreignkey")
    op.create_foreign_key(
        "leads_converted_to_patient_id_fkey",
        "leads", "patients",
        ["converted_to_patient_id"], ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("leads_converted_to_patient_id_fkey", "leads", type_="foreignkey")
    op.create_foreign_key(
        "leads_converted_to_patient_id_fkey",
        "leads", "users",
        ["converted_to_patient_id"], ["id"],
        ondelete="SET NULL",
    )
    op.drop_table("patients")
    op.execute("DROP SEQUENCE IF EXISTS patients_patient_number_seq")