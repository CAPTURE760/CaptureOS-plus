"""add tag level

Revision ID: 002
Revises: 001
Create Date: 2026-06-16
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tags",
        sa.Column("level", sa.SmallInteger(), server_default="1", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("tags", "level")
