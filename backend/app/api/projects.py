from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.base import create_crud_router
from app.api.deps import get_db
from app.api.entity_relations import get_related_entities
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = create_crud_router(
    model=Project,
    create_schema=ProjectCreate,
    update_schema=ProjectUpdate,
    response_schema=ProjectResponse,
    prefix="/projects",
    tags=["projects"],
)


@router.get("/{item_id}/related")
async def get_project_related(item_id: int, db: AsyncSession = Depends(get_db)):
    """获取项目的所有关联实体。"""
    return await get_related_entities("project", item_id, db)
