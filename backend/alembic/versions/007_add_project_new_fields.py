"""add project deploy_url, run_command, tech_stack

Revision ID: 007
Revises: 006
Create Date: 2026-06-18
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("deploy_url", sa.String(500), nullable=True))
    op.add_column("projects", sa.Column("run_command", sa.Text(), nullable=True))
    op.add_column("projects", sa.Column("tech_stack", sa.String(200), nullable=True))


def downgrade() -> None:
    op.drop_column("projects", "tech_stack")
    op.drop_column("projects", "run_command")
    op.drop_column("projects", "deploy_url")
