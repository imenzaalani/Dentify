"""add payment plans tables

Revision ID: c1d2e3f4a5b6
Revises: a7b8c9d0e1f2
Create Date: 2026-07-26 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "c1d2e3f4a5b6"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "payment_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("frequency", sa.String(length=10), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("invoice_id", name="uq_payment_plans_invoice_id"),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_payment_plans_invoice_id", "payment_plans", ["invoice_id"])

    op.create_table(
        "payment_plan_installments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("due_date", sa.String(length=10), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(length=10), nullable=False, server_default="pending"),
        sa.Column("paid_at", sa.String(length=10), nullable=True),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["plan_id"], ["payment_plans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["payment_id"], ["invoice_payments.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_payment_plan_installments_plan_id", "payment_plan_installments", ["plan_id"])
    op.create_index("ix_payment_plan_installments_payment_id", "payment_plan_installments", ["payment_id"])


def downgrade() -> None:
    op.drop_index("ix_payment_plan_installments_payment_id", table_name="payment_plan_installments")
    op.drop_index("ix_payment_plan_installments_plan_id", table_name="payment_plan_installments")
    op.drop_table("payment_plan_installments")

    op.drop_index("ix_payment_plans_invoice_id", table_name="payment_plans")
    op.drop_table("payment_plans")