"""Tag-based relation suggestion API.

Given an entity, find other entities that share the most tags,
ranked by shared tag count. This powers the "可能关联" feature.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models import ENTITY_TYPES
from app.models.tag import EntityTag, Tag

router = APIRouter(prefix="/suggestions", tags=["suggestions"])

# 每种实体对应的中文名和模型导入
ENTITY_MODELS = {}
for _type_name in ENTITY_TYPES:
    if _type_name == "project":
        from app.models.project import Project
        ENTITY_MODELS["project"] = Project
    elif _type_name == "experience":
        from app.models.experience import Experience
        ENTITY_MODELS["experience"] = Experience
    elif _type_name == "issue":
        from app.models.issue import Issue
        ENTITY_MODELS["issue"] = Issue
    elif _type_name == "solution":
        from app.models.solution import Solution
        ENTITY_MODELS["solution"] = Solution
    elif _type_name == "knowledge":
        from app.models.knowledge import Knowledge
        ENTITY_MODELS["knowledge"] = Knowledge
    elif _type_name == "decision":
        from app.models.decision import Decision
        ENTITY_MODELS["decision"] = Decision
    elif _type_name == "review":
        from app.models.review import Review
        ENTITY_MODELS["review"] = Review


@router.get("/{entity_type}/{entity_id}")
async def get_suggestions(
    entity_type: str,
    entity_id: int,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """为指定实体推荐可能关联的其他实体（基于共享标签）。

    逻辑：
    1. 获取该实体的所有 tag_id
    2. 查找其他实体中也打了这些标签的
    3. 按共享标签数降序排列
    """
    if entity_type not in ENTITY_MODELS:
        return {"suggestions": []}

    # 1. 获取该实体的标签
    my_tags_result = await db.execute(
        select(EntityTag.tag_id).where(
            EntityTag.entity_type == entity_type,
            EntityTag.entity_id == entity_id,
        )
    )
    my_tag_ids = [row[0] for row in my_tags_result.all()]

    if not my_tag_ids:
        return {"suggestions": []}

    # 2. 查找共享标签的其他实体，按共享数排序
    #    GROUP BY (entity_type, entity_id)，COUNT 共享标签数
    shared_query = (
        select(
            EntityTag.entity_type,
            EntityTag.entity_id,
            func.count(EntityTag.tag_id).label("shared_count"),
            func.array_agg(Tag.name).label("shared_tag_names"),
        )
        .join(Tag, Tag.id == EntityTag.tag_id)
        .where(
            EntityTag.tag_id.in_(my_tag_ids),
            # 排除自身
            ~(
                (EntityTag.entity_type == entity_type)
                & (EntityTag.entity_id == entity_id)
            ),
        )
        .group_by(EntityTag.entity_type, EntityTag.entity_id)
        .order_by(func.count(EntityTag.tag_id).desc())
        .limit(limit)
    )

    result = await db.execute(shared_query)
    rows = result.all()

    # 3. 批量获取实体标题
    suggestions = []
    for row in rows:
        etype, eid, shared_count, shared_names = row
        model = ENTITY_MODELS.get(etype)
        if not model:
            continue

        title_result = await db.execute(
            select(model.title).where(model.id == eid)
        )
        title_row = title_result.first()
        title = title_row[0] if title_row else f"{etype} #{eid}"

        suggestions.append({
            "entity_type": etype,
            "entity_id": eid,
            "title": title,
            "shared_count": shared_count,
            "shared_tag_names": shared_names or [],
        })

    return {"suggestions": suggestions}
