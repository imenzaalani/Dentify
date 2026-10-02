"""add treatment_step_id to appointments

Revision ID: e2f4a6b8c0d1
Revises: c1d2e3f4a5b6
Create Date: 2026-07-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "e2f4a6b8c0d1"
down_revision = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "appointments",
        sa.Column("treatment_step_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_appointments_treatment_step_id_treatment_steps",
        "appointments",
        "treatment_steps",
        ["treatment_step_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_appointments_treatment_step_id_treatment_steps",
        "appointments",
        type_="foreignkey",
    )
    op.drop_column("appointments", "treatment_step_id")
