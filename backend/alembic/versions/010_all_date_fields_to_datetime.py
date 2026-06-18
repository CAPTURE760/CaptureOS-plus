"""change all entity date fields to datetime

Revision ID: 010
Revises: 009
Create Date: 2026-06-18
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Project
    op.alter_column("projects", "start_date", type_=sa.DateTime(timezone=True), existing_type=sa.Date(), nullable=True)
    op.alter_column("projects", "end_date", type_=sa.DateTime(timezone=True), existing_type=sa.Date(), nullable=True)
    # Experience
    op.alter_column("experiences", "event_date", type_=sa.DateTime(timezone=True), existing_type=sa.Date(), nullable=True)
    # Solution
    op.alter_column("solutions", "implemented_date", type_=sa.DateTime(timezone=True), existing_type=sa.Date(), nullable=True)
    # Decision
    op.alter_column("decisions", "decision_date", type_=sa.DateTime(timezone=True), existing_type=sa.Date(), nullable=True)
    # Review
    op.alter_column("reviews", "review_date", type_=sa.DateTime(timezone=True), existing_type=sa.Date(), nullable=True)


def downgrade() -> None:
    op.alter_column("reviews", "review_date", type_=sa.Date(), existing_type=sa.DateTime(timezone=True), nullable=True)
    op.alter_column("decisions", "decision_date", type_=sa.Date(), existing_type=sa.DateTime(timezone=True), nullable=True)
    op.alter_column("solutions", "implemented_date", type_=sa.Date(), existing_type=sa.DateTime(timezone=True), nullable=True)
    op.alter_column("experiences", "event_date", type_=sa.Date(), existing_type=sa.DateTime(timezone=True), nullable=True)
    op.alter_column("projects", "end_date", type_=sa.Date(), existing_type=sa.DateTime(timezone=True), nullable=True)
    op.alter_column("projects", "start_date", type_=sa.Date(), existing_type=sa.DateTime(timezone=True), nullable=True)
