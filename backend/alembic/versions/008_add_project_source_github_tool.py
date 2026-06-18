"""add project source_url, github_url, tool; drop deploy_url

Revision ID: 008
Revises: 007
Create Date: 2026-06-18
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("source_url", sa.String(500), nullable=True))
    op.add_column("projects", sa.Column("github_url", sa.String(500), nullable=True))
    op.add_column("projects", sa.Column("tool", sa.String(50), nullable=True))
    op.drop_column("projects", "deploy_url")


def downgrade() -> None:
    op.add_column("projects", sa.Column("deploy_url", sa.String(500), nullable=True))
    op.drop_column("projects", "tool")
    op.drop_column("projects", "github_url")
    op.drop_column("projects", "source_url")
