from app.api.base import create_crud_router
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
