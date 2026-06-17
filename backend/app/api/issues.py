from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.base import create_crud_router
from app.api.deps import get_db
from app.api.entity_relations import get_related_entities
from app.models.issue import Issue
from app.schemas.issue import IssueCreate, IssueUpdate, IssueResponse

router = create_crud_router(
    model=Issue,
    create_schema=IssueCreate,
    update_schema=IssueUpdate,
    response_schema=IssueResponse,
    prefix="/issues",
    tags=["issues"],
)


@router.get("/{item_id}/related")
async def get_issue_related(item_id: int, db: AsyncSession = Depends(get_db)):
    """获取问题的所有关联实体。"""
    return await get_related_entities("issue", item_id, db)
