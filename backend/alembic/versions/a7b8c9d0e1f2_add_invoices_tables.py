"""add invoices tables

Revision ID: a7b8c9d0e1f2
Revises: f1e2d3c4b5a6
Create Date: 2026-07-26 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a7b8c9d0e1f2"
down_revision = "f1e2d3c4b5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "invoices",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("number", sa.String(length=30), nullable=False),
        sa.Column("doc_type", sa.String(length=10), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("treatment_plan_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("issue_date", sa.String(length=10), nullable=False),
        sa.Column("due_date", sa.String(length=10), nullable=True),
        sa.Column("global_discount_pct", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("total", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("paid_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("payment_terms", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("number", name="uq_invoices_number"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["treatment_plan_id"], ["treatment_plans.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_invoices_patient_id", "invoices", ["patient_id"])
    op.create_index("ix_invoices_treatment_plan_id", "invoices", ["treatment_plan_id"])

    op.create_table(
        "invoice_line_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=300), nullable=False),
        sa.Column("tooth", sa.String(length=50), nullable=True),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False, server_default="1"),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("discount_pct", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_invoice_line_items_invoice_id", "invoice_line_items", ["invoice_id"])

    op.create_table(
        "invoice_payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("payment_date", sa.String(length=10), nullable=False),
        sa.Column("method", sa.String(length=20), nullable=False),
        sa.Column("reference", sa.String(length=100), nullable=True),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("recorded_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recorded_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_invoice_payments_invoice_id", "invoice_payments", ["invoice_id"])
    op.create_index("ix_invoice_payments_recorded_by", "invoice_payments", ["recorded_by"])


def downgrade() -> None:
    op.drop_index("ix_invoice_payments_recorded_by", table_name="invoice_payments")
    op.drop_index("ix_invoice_payments_invoice_id", table_name="invoice_payments")
    op.drop_table("invoice_payments")

    op.drop_index("ix_invoice_line_items_invoice_id", table_name="invoice_line_items")
    op.drop_table("invoice_line_items")

    op.drop_index("ix_invoices_treatment_plan_id", table_name="invoices")
    op.drop_index("ix_invoices_patient_id", table_name="invoices")
    op.drop_table("invoices")
