"""add pg_trgm GIN indexes for Chinese search

Revision ID: 005
Revises: 004
Create Date: 2026-06-17
"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 启用 pg_trgm 扩展（支持 ILIKE 的 GIN 索引加速）
    op.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))

    # 为每张核心表的标题字段创建 pg_trgm GIN 索引
    trgm_indexes = [
        ("ix_issues_title_trgm", "issues", "title"),
        ("ix_projects_title_trgm", "projects", "title"),
        ("ix_solutions_title_trgm", "solutions", "title"),
        ("ix_knowledge_title_trgm", "knowledge", "title"),
        ("ix_decisions_title_trgm", "decisions", "title"),
        ("ix_experiences_title_trgm", "experiences", "title"),
        ("ix_reviews_title_trgm", "reviews", "title"),
    ]

    for index_name, table_name, column in trgm_indexes:
        op.execute(text(
            f"CREATE INDEX {index_name} ON {table_name} USING gin ({column} gin_trgm_ops)"
        ))


def downgrade() -> None:
    trgm_indexes = [
        "ix_issues_title_trgm",
        "ix_projects_title_trgm",
        "ix_solutions_title_trgm",
        "ix_knowledge_title_trgm",
        "ix_decisions_title_trgm",
        "ix_experiences_title_trgm",
        "ix_reviews_title_trgm",
    ]
    for index_name in trgm_indexes:
        op.execute(text(f"DROP INDEX IF EXISTS {index_name}"))

    op.execute(text("DROP EXTENSION IF EXISTS pg_trgm"))
