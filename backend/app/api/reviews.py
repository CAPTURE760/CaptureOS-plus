from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.base import create_crud_router
from app.api.deps import get_db
from app.api.entity_relations import get_related_entities
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse

router = create_crud_router(
    model=Review,
    create_schema=ReviewCreate,
    update_schema=ReviewUpdate,
    response_schema=ReviewResponse,
    prefix="/reviews",
    tags=["reviews"],
)


@router.get("/{item_id}/related")
async def get_review_related(item_id: int, db: AsyncSession = Depends(get_db)):
    """获取复盘的所有关联实体。"""
    return await get_related_entities("review", item_id, db)
