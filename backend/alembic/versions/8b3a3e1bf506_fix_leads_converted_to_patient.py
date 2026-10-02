"""fix leads.converted_to_patient_id FK to point at patients, not users

Revision ID: 8b3a3e1bf506
Revises: f9d87513ae29
Create Date: 2026-07-14 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '8b3a3e1bf506'
down_revision = 'f9d87513ae29'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("leads_converted_to_patient_id_fkey", "leads", type_="foreignkey")
    op.create_foreign_key(
        "leads_converted_to_patient_id_fkey",
        "leads",
        "patients",
        ["converted_to_patient_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("leads_converted_to_patient_id_fkey", "leads", type_="foreignkey")
    op.create_foreign_key(
        "leads_converted_to_patient_id_fkey",
        "leads",
        "users",
        ["converted_to_patient_id"],
        ["id"],
    )