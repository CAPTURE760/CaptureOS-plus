"""Search API — 支持中文子串匹配和标签筛选。"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.decision import Decision
from app.models.experience import Experience
from app.models.issue import Issue
from app.models.knowledge import Knowledge
from app.models.project import Project
from app.models.review import Review
from app.models.solution import Solution
from app.models.tag import EntityTag

router = APIRouter(prefix="/search", tags=["search"])

# 搜索配置：(类型名, 模型, 搜索字段列表)
SEARCH_CONFIG = [
    ("project", Project, [Project.title, Project.description]),
    ("experience", Experience, [Experience.title, Experience.summary, Experience.lesson]),
    ("issue", Issue, [Issue.title, Issue.description, Issue.root_cause]),
    ("solution", Solution, [Solution.title, Solution.description, Solution.approach]),
    ("knowledge", Knowledge, [Knowledge.title, Knowledge.content]),
    ("decision", Decision, [Decision.title, Decision.background, Decision.reason]),
    ("review", Review, [Review.title, Review.event_summary]),
]


@router.get("/")
async def search(
    q: str | None = Query(None),
    entity_type: str | None = None,
    tag_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    results = []

    # 如果有 tag_id，先获取关联的实体 ID
    tag_entity_filter = None
    if tag_id is not None:
        tag_query = select(EntityTag.entity_type, EntityTag.entity_id).where(
            EntityTag.tag_id == tag_id
        )
        tag_result = await db.execute(tag_query)
        tag_entities = {(et.entity_type, et.entity_id) for et in tag_result.all()}
        tag_entity_filter = tag_entities

    for etype, model, search_fields in SEARCH_CONFIG:
        if entity_type and etype != entity_type:
            continue

        if q:
            # 有关键词：ILIKE 子串匹配
            conditions = [field.ilike(f"%{q}%") for field in search_fields]
            query = select(model).where(or_(*conditions)).limit(20)
        else:
            # 无关键词：返回全部
            query = select(model).limit(20)

        result = await db.execute(query)
        items = result.scalars().all()

        for item in items:
            # 如果有标签筛选，检查实体是否在标签关联中
            if tag_entity_filter is not None:
                if (etype, item.id) not in tag_entity_filter:
                    continue

            results.append({
                "entity_type": etype,
                "entity_id": item.id,
                "title": item.title,
                "snippet": _get_snippet(item, search_fields, q) if q else "",
            })

    return {"query": q or "", "results": results, "total": len(results)}


def _get_snippet(item, fields, query: str | None) -> str:
    """从匹配字段中提取包含查询词的片段。"""
    if not query:
        return ""
    for field in fields:
        value = getattr(item, field.name, None)
        if value and query.lower() in value.lower():
            idx = value.lower().index(query.lower())
            start = max(0, idx - 50)
            end = min(len(value), idx + len(query) + 50)
            snippet = value[start:end]
            if start > 0:
                snippet = "..." + snippet
            if end < len(value):
                snippet = snippet + "..."
            return snippet
    return ""
