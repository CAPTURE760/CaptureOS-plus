from app.api.base import create_crud_router
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
