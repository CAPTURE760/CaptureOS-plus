"""Timeline API — 支持 7 种实体 + 链路聚合。"""
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.decision import Decision
from app.models.experience import Experience
from app.models.issue import Issue
from app.models.knowledge import Knowledge
from app.models.project import Project
from app.models.relation import Relation
from app.models.review import Review
from app.models.solution import Solution

router = APIRouter(prefix="/timeline", tags=["timeline"])

# Union-Find: 用于链路聚合
_parent: dict[int, int] = {}


def _find(x: int) -> int:
    while _parent[x] != x:
        _parent[x] = _parent[_parent[x]]
        x = _parent[x]
    return x


def _union(a: int, b: int) -> None:
    ra, rb = _find(a), _find(b)
    if ra != rb:
        _parent[ra] = rb


# 链路聚合用的关系类型（这些关系能构成链路）
CHAIN_RELATION_TYPES = {"solved_by", "caused_by", "learned_from", "follows", "part_of", "related_to"}


def _collect_events(
    model, date_field, entity_type_name: str, start_date, end_date
) -> list[dict[str, Any]]:
    """从单个模型收集时间线事件。"""
    query = select(model)
    if start_date and date_field is not None:
        query = query.where(date_field >= start_date)
    if end_date and date_field is not None:
        query = query.where(date_field <= end_date)
    # 同步查询需要在调用方执行，这里只构建查询
    return query


@router.get("/")
async def get_timeline(
    start_date: date | None = None,
    end_date: date | None = None,
    entity_type: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    events = []

    # (模型, 日期字段, 类型名, 额外字段提取器)
    entity_configs = [
        (Project, Project.start_date, "project", lambda i: {"status": i.status}),
        (Experience, Experience.event_date, "experience", lambda i: {}),
        (Issue, Issue.discovered_date, "issue", lambda i: {"status": i.status}),
        (Solution, Solution.implemented_date, "solution", lambda i: {"effectiveness": i.effectiveness}),
        (Knowledge, Knowledge.created_at, "knowledge", lambda i: {}),
        (Decision, Decision.decision_date, "decision", lambda i: {}),
        (Review, Review.review_date, "review", lambda i: {"rating": i.rating}),
    ]

    for model, date_field, etype, extra_fn in entity_configs:
        if entity_type and etype != entity_type:
            continue

        query = select(model)
        if start_date and date_field is not None:
            query = query.where(date_field >= start_date)
        if end_date and date_field is not None:
            query = query.where(date_field <= end_date)

        result = await db.execute(query)
        for item in result.scalars().all():
            # 日期回退：优先用业务日期，回退到 created_at
            d = None
            if date_field is not None:
                d = getattr(item, date_field.name, None)
            if d is None:
                d = item.created_at.date() if hasattr(item, "created_at") else None

            entry = {
                "entity_type": etype,
                "entity_id": item.id,
                "title": item.title,
                "date": d,
            }
            entry.update(extra_fn(item))
            events.append(entry)

    events.sort(key=lambda x: x["date"] or date.min, reverse=True)
    return events


@router.get("/chains")
async def get_timeline_chains(
    start_date: date | None = None,
    end_date: date | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """链路聚合时间线。

    逻辑：
    1. 查所有 relations 表中属于链路类型的关系
    2. 用 Union-Find 把有关系的实体合并成组
    3. 每个组 = 一条链路，取组内最晚日期的实体作为代表
    4. 没有被合并的实体 = 孤立事件
    """
    global _parent
    _parent.clear()

    # 收集所有有日期的实体
    all_entities: dict[tuple[str, int], dict] = {}  # (type, id) → event dict

    entity_configs = [
        (Project, Project.start_date, "project"),
        (Experience, Experience.event_date, "experience"),
        (Issue, Issue.discovered_date, "issue"),
        (Solution, Solution.implemented_date, "solution"),
        (Knowledge, Knowledge.created_at, "knowledge"),
        (Decision, Decision.decision_date, "decision"),
        (Review, Review.review_date, "review"),
    ]

    for model, date_field, etype in entity_configs:
        query = select(model)
        if start_date and date_field is not None:
            query = query.where(date_field >= start_date)
        if end_date and date_field is not None:
            query = query.where(date_field <= end_date)

        result = await db.execute(query)
        for item in result.scalars().all():
            d = None
            if date_field is not None:
                d = getattr(item, date_field.name, None)
            if d is None:
                d = item.created_at.date() if hasattr(item, "created_at") else None

            key = (etype, item.id)
            all_entities[key] = {
                "entity_type": etype,
                "entity_id": item.id,
                "title": item.title,
                "date": d,
            }
            _parent[f"{etype}:{item.id}"] = f"{etype}:{item.id}"

    # 查链路关系
    from app.models.relation import RelationType

    type_result = await db.execute(select(RelationType))
    type_map = {rt.id: rt.name for rt in type_result.scalars().all()}

    # 只查链路类型的关系
    chain_type_ids = [tid for tid, name in type_map.items() if name in CHAIN_RELATION_TYPES]
    if chain_type_ids:
        rel_query = select(Relation).where(Relation.relation_type_id.in_(chain_type_ids))
        # 日期过滤
        if start_date:
            rel_query = rel_query.where(Relation.created_at >= start_date)
        if end_date:
            rel_query = rel_query.where(Relation.created_at <= end_date)

        rel_result = await db.execute(rel_query)
        for rel in rel_result.scalars().all():
            src = f"{rel.source_type}:{rel.source_id}"
            tgt = f"{rel.target_type}:{rel.target_id}"
            if src in _parent and tgt in _parent:
                _union(src, tgt)

    # 分组
    groups: dict[str, list[dict]] = {}
    for key_str, entity in all_entities.items():
        root = _find(key_str)
        groups.setdefault(root, []).append(entity)

    # 构建结果
    chains = []
    for root, entities in groups.items():
        if len(entities) == 1:
            # 孤立事件
            e = entities[0]
            chains.append({
                "type": "single",
                "title": e["title"],
                "date": e["date"],
                "entity": e,
            })
        else:
            # 链路：找问题作为标题，取最晚日期
            issues = [e for e in entities if e["entity_type"] == "issue"]
            title = issues[0]["title"] if issues else entities[0]["title"]
            latest_date = max((e["date"] for e in entities if e["date"]), default=None)
            chains.append({
                "type": "chain",
                "title": title,
                "date": latest_date,
                "entity_count": len(entities),
                "entities": sorted(entities, key=lambda x: x["date"] or date.min),
            })

    chains.sort(key=lambda x: x["date"] or date.min, reverse=True)
    return chains
