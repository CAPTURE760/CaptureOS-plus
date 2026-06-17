from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.base import create_crud_router
from app.api.deps import get_db
from app.api.entity_relations import get_related_entities
from app.models.solution import Solution
from app.schemas.solution import SolutionCreate, SolutionUpdate, SolutionResponse

router = create_crud_router(
    model=Solution,
    create_schema=SolutionCreate,
    update_schema=SolutionUpdate,
    response_schema=SolutionResponse,
    prefix="/solutions",
    tags=["solutions"],
)


@router.get("/{item_id}/related")
async def get_solution_related(item_id: int, db: AsyncSession = Depends(get_db)):
    """获取解决方案的所有关联实体。"""
    return await get_related_entities("solution", item_id, db)
