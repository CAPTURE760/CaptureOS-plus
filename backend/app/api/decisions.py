from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.base import create_crud_router
from app.api.deps import get_db
from app.api.entity_relations import get_related_entities
from app.models.decision import Decision
from app.schemas.decision import DecisionCreate, DecisionUpdate, DecisionResponse

router = create_crud_router(
    model=Decision,
    create_schema=DecisionCreate,
    update_schema=DecisionUpdate,
    response_schema=DecisionResponse,
    prefix="/decisions",
    tags=["decisions"],
)


@router.get("/{item_id}/related")
async def get_decision_related(item_id: int, db: AsyncSession = Depends(get_db)):
    """获取决策的所有关联实体。"""
    return await get_related_entities("decision", item_id, db)
