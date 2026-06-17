"""update priority, confidence, add status fields

Revision ID: 004
Revises: 003
Create Date: 2026-06-17
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Issue: priority SmallInteger → String(20) ──
    op.alter_column("issues", "priority",
        type_=sa.String(20),
        server_default="中",
        existing_type=sa.SmallInteger(),
    )

    # ── Project: priority SmallInteger → String(20) ──
    op.alter_column("projects", "priority",
        type_=sa.String(20),
        server_default="中",
        existing_type=sa.SmallInteger(),
    )

    # ── Knowledge: confidence Numeric(3,2) → SmallInteger, add status ──
    op.alter_column("knowledge", "confidence",
        type_=sa.SmallInteger(),
        existing_type=sa.Numeric(3, 2),
    )
    op.add_column("knowledge",
        sa.Column("status", sa.String(20), server_default="unverified", nullable=False),
    )

    # ── Decision: confidence Numeric(3,2) → SmallInteger, add status ──
    op.alter_column("decisions", "confidence",
        type_=sa.SmallInteger(),
        existing_type=sa.Numeric(3, 2),
    )
    op.add_column("decisions",
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("decisions", "status")
    op.alter_column("decisions", "confidence",
        type_=sa.Numeric(3, 2),
        existing_type=sa.SmallInteger(),
    )

    op.drop_column("knowledge", "status")
    op.alter_column("knowledge", "confidence",
        type_=sa.Numeric(3, 2),
        existing_type=sa.SmallInteger(),
    )

    op.alter_column("projects", "priority",
        type_=sa.SmallInteger(),
        server_default="0",
        existing_type=sa.String(20),
    )

    op.alter_column("issues", "priority",
        type_=sa.SmallInteger(),
        server_default="0",
        existing_type=sa.String(20),
    )
