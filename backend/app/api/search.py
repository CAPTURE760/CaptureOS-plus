"""Search API — 支持中文子串匹配。"""
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
    q: str = Query(..., min_length=1),
    entity_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    results = []

    for etype, model, search_fields in SEARCH_CONFIG:
        if entity_type and etype != entity_type:
            continue

        # 使用 ILIKE 做子串匹配，支持中文
        conditions = [field.ilike(f"%{q}%") for field in search_fields]
        query = select(model).where(or_(*conditions)).limit(10)
        result = await db.execute(query)
        items = result.scalars().all()

        for item in items:
            results.append({
                "entity_type": etype,
                "entity_id": item.id,
                "title": item.title,
                "snippet": _get_snippet(item, search_fields, q),
            })

    return {"query": q, "results": results, "total": len(results)}


def _get_snippet(item, fields, query: str) -> str:
    """从匹配字段中提取包含查询词的片段。"""
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
