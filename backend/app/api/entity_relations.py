"""Shared helper for fetching related entities of any core entity.

Used by each entity router to add a GET /{id}/related endpoint.
"""
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.relation import Relation, RelationType


# 实体类型 → 模型的懒加载映射（避免循环导入）
_MODEL_CACHE: dict[str, Any] = {}


def _get_model(entity_type: str):
    """按需导入模型，避免模块加载顺序问题。"""
    if entity_type not in _MODEL_CACHE:
        if entity_type == "project":
            from app.models.project import Project
            _MODEL_CACHE["project"] = Project
        elif entity_type == "experience":
            from app.models.experience import Experience
            _MODEL_CACHE["experience"] = Experience
        elif entity_type == "issue":
            from app.models.issue import Issue
            _MODEL_CACHE["issue"] = Issue
        elif entity_type == "solution":
            from app.models.solution import Solution
            _MODEL_CACHE["solution"] = Solution
        elif entity_type == "knowledge":
            from app.models.knowledge import Knowledge
            _MODEL_CACHE["knowledge"] = Knowledge
        elif entity_type == "decision":
            from app.models.decision import Decision
            _MODEL_CACHE["decision"] = Decision
        elif entity_type == "review":
            from app.models.review import Review
            _MODEL_CACHE["review"] = Review
    return _MODEL_CACHE.get(entity_type)


# 实体类型中文名
ENTITY_LABELS = {
    "project": "项目",
    "experience": "经验",
    "issue": "问题",
    "solution": "解决方案",
    "knowledge": "知识",
    "decision": "决策",
    "review": "复盘",
}


async def get_related_entities(
    entity_type: str,
    entity_id: int,
    db: AsyncSession,
) -> dict[str, Any]:
    """查询指定实体的所有关联关系，按目标实体类型分组返回。

    返回格式：
    {
        "relations": [
            {
                "id": 1,
                "source_type": "issue",
                "source_id": 1,
                "target_type": "solution",
                "target_id": 1,
                "relation_type": {"name": "solved_by", "description": "被...解决"},
                "target_title": "查看公司差旅制度文档",
            },
            ...
        ],
        "by_type": {
            "solution": [...],
            "knowledge": [...],
            ...
        }
    }
    """
    # 查所有以该实体为 source 或 target 的关系
    query = (
        select(Relation)
        .options(selectinload(Relation.relation_type))
        .where(
            or_(
                (Relation.source_type == entity_type) & (Relation.source_id == entity_id),
                (Relation.target_type == entity_type) & (Relation.target_id == entity_id),
            )
        )
    )

    result = await db.execute(query)
    relations = result.scalars().unique().all()

    # 为每个关联获取目标实体的标题
    enriched = []
    for rel in relations:
        # 确定哪端是"对方"
        if rel.source_type == entity_type and rel.source_id == entity_id:
            other_type = rel.target_type
            other_id = rel.target_id
        else:
            other_type = rel.source_type
            other_id = rel.source_id

        # 查对方标题
        model = _get_model(other_type)
        title = f"{ENTITY_LABELS.get(other_type, other_type)} #{other_id}"
        if model:
            title_result = await db.execute(
                select(model.title).where(model.id == other_id)
            )
            title_row = title_result.first()
            if title_row:
                title = title_row[0]

        enriched.append({
            "relation_id": rel.id,
            "source_type": rel.source_type,
            "source_id": rel.source_id,
            "target_type": rel.target_type,
            "target_id": rel.target_id,
            "relation_type": {
                "name": rel.relation_type.name,
                "description": rel.relation_type.description,
                "reverse_name": rel.relation_type.reverse_name,
            },
            "target_title": title,
            "target_entity_type": other_type,
            "target_entity_id": other_id,
        })

    # 按目标类型分组
    by_type: dict[str, list] = {}
    for item in enriched:
        t = item["target_entity_type"]
        by_type.setdefault(t, []).append(item)

    return {"relations": enriched, "by_type": by_type}
