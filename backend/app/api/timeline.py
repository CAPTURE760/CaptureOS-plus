"""Timeline API — 支持 7 种实体 + 链路聚合。"""
from datetime import date, timedelta
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
from app.models.relation import Relation, RelationType
from app.models.review import Review
from app.models.solution import Solution

router = APIRouter(prefix="/timeline", tags=["timeline"])

# 链路聚合用的关系类型
CHAIN_RELATION_TYPES = {"solved_by", "caused_by", "learned_from", "follows", "part_of", "related_to"}

# 所有实体配置：(模型, 日期字段名, 类型名)
ENTITY_CONFIGS = [
    (Project, "start_date", "project"),
    (Experience, "event_date", "experience"),
    (Issue, "discovered_date", "issue"),
    (Solution, "implemented_date", "solution"),
    (Knowledge, "created_at", "knowledge"),
    (Decision, "decision_date", "decision"),
    (Review, "review_date", "review"),
]


def _get_date(item, date_field_name: str) -> date | None:
    """安全获取实体日期，统一返回 date 对象。"""
    d = getattr(item, date_field_name, None)
    if d is None:
        d = getattr(item, "created_at", None)
    if d is None:
        return None
    # datetime → date
    if hasattr(d, "date") and callable(d.date):
        return d.date()
    # 已经是 date
    if isinstance(d, date):
        return d
    return None


def _get_datetime(item, date_field_name: str) -> str | None:
    """获取实体的完整时间戳，返回 ISO 格式字符串。"""
    from datetime import datetime as dt
    d = getattr(item, date_field_name, None)
    if d is None:
        d = getattr(item, "created_at", None)
    if d is None:
        return None
    if isinstance(d, dt):
        return d.isoformat()
    if isinstance(d, date):
        return d.isoformat()
    return None


def _in_range(d: date | None, start: date | None, end: date | None) -> bool:
    """判断日期是否在范围内。d 为 None 时视为不在范围内。"""
    if d is None:
        return False
    if start and d < start:
        return False
    if end and d > end:
        return False
    return True


@router.get("/")
async def get_timeline(
    start_date: date | None = None,
    end_date: date | None = None,
    entity_type: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    events = []

    for model, date_field_name, etype in ENTITY_CONFIGS:
        if entity_type and etype != entity_type:
            continue

        query = select(model)
        result = await db.execute(query)
        for item in result.scalars().all():
            d = _get_date(item, date_field_name)
            created = _get_date(item, "created_at")
            # 筛选：业务日期 OR 创建时间 任一在范围内就显示
            if (start_date or end_date) and not _in_range(d, start_date, end_date) and not _in_range(created, start_date, end_date):
                continue

            entry: dict[str, Any] = {
                "entity_type": etype,
                "entity_id": item.id,
                "title": item.title,
                "date": d.isoformat() if d else None,
                "datetime": _get_datetime(item, "created_at"),
            }
            # 附加额外字段
            if hasattr(item, "status"):
                entry["status"] = item.status
            if hasattr(item, "rating") and item.rating:
                entry["rating"] = item.rating
            if hasattr(item, "effectiveness") and item.effectiveness:
                entry["effectiveness"] = item.effectiveness
            events.append(entry)

    events.sort(key=lambda x: (x["entity_type"], x["datetime"] or x["date"] or "0000-01-01"), reverse=True)
    return events


@router.get("/chains")
async def get_timeline_chains(
    start_date: date | None = None,
    end_date: date | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """链路聚合时间线。"""
    # 1. 收集所有实体
    all_entities: dict[str, dict] = {}
    for model, date_field_name, etype in ENTITY_CONFIGS:
        query = select(model)
        result = await db.execute(query)
        for item in result.scalars().all():
            d = _get_date(item, date_field_name)
            created = _get_date(item, "created_at")
            if (start_date or end_date) and not _in_range(d, start_date, end_date) and not _in_range(created, start_date, end_date):
                continue
            key = f"{etype}:{item.id}"
            all_entities[key] = {
                "entity_type": etype,
                "entity_id": item.id,
                "title": item.title,
                "date": d.isoformat() if d else None,
                "datetime": _get_datetime(item, "created_at"),
            }

    # 2. 查链路关系，用 Union-Find 分组
    parent: dict[str, str] = {}

    def find(x: str) -> str:
        if x not in parent:
            parent[x] = x
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: str, b: str) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    # 初始化所有实体为独立组
    for key in all_entities:
        parent[key] = key

    # 查关系
    type_result = await db.execute(select(RelationType))
    type_map = {rt.id: rt.name for rt in type_result.scalars().all()}
    chain_type_ids = [tid for tid, name in type_map.items() if name in CHAIN_RELATION_TYPES]

    if chain_type_ids:
        rel_query = select(Relation).where(Relation.relation_type_id.in_(chain_type_ids))
        rel_result = await db.execute(rel_query)
        for rel in rel_result.scalars().all():
            src = f"{rel.source_type}:{rel.source_id}"
            tgt = f"{rel.target_type}:{rel.target_id}"
            if src in parent and tgt in parent:
                union(src, tgt)

    # 3. 按根节点分组
    groups: dict[str, list[dict]] = {}
    for key, entity in all_entities.items():
        root = find(key)
        groups.setdefault(root, []).append(entity)

    # 4. 构建结果
    chains = []
    for entities in groups.values():
        if len(entities) == 1:
            e = entities[0]
            chains.append({
                "type": "single",
                "title": e["title"],
                "date": e["date"],
                "datetime": e.get("datetime"),
                "entity": e,
            })
        else:
            issues = [e for e in entities if e["entity_type"] == "issue"]
            title = issues[0]["title"] if issues else entities[0]["title"]
            dates = [e["date"] for e in entities if e["date"]]
            latest_date = max(dates) if dates else None
            datetimes = [e["datetime"] for e in entities if e.get("datetime")]
            latest_datetime = max(datetimes) if datetimes else None
            chains.append({
                "type": "chain",
                "title": title,
                "date": latest_date,
                "datetime": latest_datetime,
                "entity_count": len(entities),
                "entities": sorted(entities, key=lambda x: x["datetime"] or x["date"] or "0000-01-01"),
            })

    def _chain_sort_key(c):
        if c["type"] == "single" and c.get("entity"):
            return (c["entity"]["entity_type"], c["entity"].get("datetime") or c["date"] or "0000-01-01")
        if c.get("entities"):
            return (c["entities"][0]["entity_type"], c.get("date") or "0000-01-01")
        return ("zzz", c.get("date") or "0000-01-01")

    chains.sort(key=_chain_sort_key, reverse=True)
    return chains
