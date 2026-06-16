from app.api.base import create_crud_router
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
