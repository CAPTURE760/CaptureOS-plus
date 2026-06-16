from app.api.base import create_crud_router
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
