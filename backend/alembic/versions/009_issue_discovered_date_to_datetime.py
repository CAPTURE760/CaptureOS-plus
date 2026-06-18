"""change issue discovered_date from DATE to TIMESTAMP

Revision ID: 009
Revises: 008
Create Date: 2026-06-18
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "issues",
        "discovered_date",
        type_=sa.DateTime(timezone=True),
        nullable=True,
        existing_type=sa.Date(),
    )


def downgrade() -> None:
    op.alter_column(
        "issues",
        "discovered_date",
        type_=sa.Date(),
        nullable=True,
        existing_type=sa.DateTime(timezone=True),
    )
