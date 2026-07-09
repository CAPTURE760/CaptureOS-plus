"""add file attachment table

Revision ID: 011
Revises: 010
Create Date: 2025-01-09 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 创建 file_attachments 表
    op.create_table(
        'file_attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('original_name', sa.String(length=255), nullable=False),
        sa.Column('safe_name', sa.String(length=255), nullable=False, unique=True),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_file_attachments_entity_id'), 'file_attachments', ['entity_id'], unique=False)
    op.create_index(op.f('ix_file_attachments_entity_type'), 'file_attachments', ['entity_type'], unique=False)
    op.create_index(op.f('ix_file_attachments_created_at'), 'file_attachments', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_file_attachments_created_at'), table_name='file_attachments')
    op.drop_index(op.f('ix_file_attachments_entity_type'), table_name='file_attachments')
    op.drop_index(op.f('ix_file_attachments_entity_id'), table_name='file_attachments')
    op.drop_table('file_attachments')