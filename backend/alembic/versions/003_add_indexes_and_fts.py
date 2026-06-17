"""add indexes and full-text search

Revision ID: 003
Revises: 002
Create Date: 2026-06-17
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── GIN 全文索引（7 张核心表）──
    fts_indexes = [
        ("ix_issues_search", "issues",
         "to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(root_cause, ''))"),
        ("ix_projects_search", "projects",
         "to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))"),
        ("ix_solutions_search", "solutions",
         "to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(approach, ''))"),
        ("ix_knowledge_search", "knowledge",
         "to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))"),
        ("ix_decisions_search", "decisions",
         "to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(background, '') || ' ' || coalesce(reason, ''))"),
        ("ix_experiences_search", "experiences",
         "to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(lesson, ''))"),
        ("ix_reviews_search", "reviews",
         "to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(event_summary, ''))"),
    ]

    for index_name, table_name, expr in fts_indexes:
        op.execute(text(
            f'CREATE INDEX {index_name} ON {table_name} USING gin({expr})'
        ))

    # ── B-tree 索引 ──
    op.create_index("ix_entity_tags_tag_id", "entity_tags", ["tag_id"])
    op.create_index("ix_issues_status", "issues", ["status"])
    op.create_index("ix_projects_status", "projects", ["status"])

    # 各实体的日期字段：Timeline 按日期筛选排序
    op.create_index("ix_issues_discovered_date", "issues", ["discovered_date"])
    op.create_index("ix_experiences_event_date", "experiences", ["event_date"])
    op.create_index("ix_decisions_decision_date", "decisions", ["decision_date"])
    op.create_index("ix_reviews_review_date", "reviews", ["review_date"])
    op.create_index("ix_solutions_implemented_date", "solutions", ["implemented_date"])
    op.create_index("ix_projects_start_date", "projects", ["start_date"])


def downgrade() -> None:
    op.drop_index("ix_projects_start_date", table_name="projects")
    op.drop_index("ix_solutions_implemented_date", table_name="solutions")
    op.drop_index("ix_reviews_review_date", table_name="reviews")
    op.drop_index("ix_decisions_decision_date", table_name="decisions")
    op.drop_index("ix_experiences_event_date", table_name="experiences")
    op.drop_index("ix_issues_discovered_date", table_name="issues")
    op.drop_index("ix_projects_status", table_name="projects")
    op.drop_index("ix_issues_status", table_name="issues")
    op.drop_index("ix_entity_tags_tag_id", table_name="entity_tags")

    op.execute(text("DROP INDEX IF EXISTS ix_reviews_search"))
    op.execute(text("DROP INDEX IF EXISTS ix_experiences_search"))
    op.execute(text("DROP INDEX IF EXISTS ix_decisions_search"))
    op.execute(text("DROP INDEX IF EXISTS ix_knowledge_search"))
    op.execute(text("DROP INDEX IF EXISTS ix_solutions_search"))
    op.execute(text("DROP INDEX IF EXISTS ix_projects_search"))
    op.execute(text("DROP INDEX IF EXISTS ix_issues_search"))
