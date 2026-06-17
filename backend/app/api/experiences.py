from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.base import create_crud_router
from app.api.deps import get_db
from app.api.entity_relations import get_related_entities
from app.models.experience import Experience
from app.schemas.experience import ExperienceCreate, ExperienceUpdate, ExperienceResponse

router = create_crud_router(
    model=Experience,
    create_schema=ExperienceCreate,
    update_schema=ExperienceUpdate,
    response_schema=ExperienceResponse,
    prefix="/experiences",
    tags=["experiences"],
)


@router.get("/{item_id}/related")
async def get_experience_related(item_id: int, db: AsyncSession = Depends(get_db)):
    """获取经验的所有关联实体。"""
    return await get_related_entities("experience", item_id, db)
