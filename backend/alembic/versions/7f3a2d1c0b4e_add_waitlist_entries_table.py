"""add waitlist_entries table

Revision ID: 7f3a2d1c0b4e
Revises: 50212f0f4a75, a1b2c3d4e5f6
Create Date: 2026-07-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7f3a2d1c0b4e'
down_revision = ('50212f0f4a75', 'a1b2c3d4e5f6')
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'waitlist_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('care_type_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('desired_from', sa.Date(), nullable=False),
        sa.Column('desired_to', sa.Date(), nullable=False),
        sa.Column('priority', sa.String(length=10), nullable=False, server_default=sa.text("'medium'")),
        sa.Column('status', sa.String(length=20), nullable=False, server_default=sa.text("'waiting'")),
        sa.Column('notes', sa.String(length=1000), nullable=True),
        sa.Column('appointment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['care_type_id'], ['care_types.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_waitlist_entries_patient_id', 'waitlist_entries', ['patient_id'])
    op.create_index('ix_waitlist_entries_care_type_id', 'waitlist_entries', ['care_type_id'])
    op.create_index('ix_waitlist_entries_status', 'waitlist_entries', ['status'])
    op.create_index('ix_waitlist_entries_created_at', 'waitlist_entries', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_waitlist_entries_created_at', table_name='waitlist_entries')
    op.drop_index('ix_waitlist_entries_status', table_name='waitlist_entries')
    op.drop_index('ix_waitlist_entries_care_type_id', table_name='waitlist_entries')
    op.drop_index('ix_waitlist_entries_patient_id', table_name='waitlist_entries')
    op.drop_table('waitlist_entries')
