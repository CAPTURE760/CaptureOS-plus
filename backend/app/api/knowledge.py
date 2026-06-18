from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.base import create_crud_router
from app.api.deps import get_db
from app.api.entity_relations import get_related_entities
from app.models.knowledge import Knowledge
from app.schemas.knowledge import KnowledgeCreate, KnowledgeUpdate, KnowledgeResponse

router = create_crud_router(
    model=Knowledge,
    create_schema=KnowledgeCreate,
    update_schema=KnowledgeUpdate,
    response_schema=KnowledgeResponse,
    prefix="/knowledges",
    tags=["knowledges"],
)


@router.get("/{item_id}/related")
async def get_knowledge_related(item_id: int, db: AsyncSession = Depends(get_db)):
    """获取知识的所有关联实体。"""
    return await get_related_entities("knowledge", item_id, db)
