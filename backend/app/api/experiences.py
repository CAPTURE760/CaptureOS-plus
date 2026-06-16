from app.api.base import create_crud_router
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
