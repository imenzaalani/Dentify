"""add send_confirmation to appointments

Revision ID: a1b2c3d4e5f6
Revises: c873cf2e52bb
Create Date: 2026-07-21 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'c873cf2e52bb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'appointments',
        sa.Column('send_confirmation', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )


def downgrade() -> None:
    op.drop_column('appointments', 'send_confirmation')
