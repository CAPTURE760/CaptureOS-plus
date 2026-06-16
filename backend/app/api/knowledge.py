from app.api.base import create_crud_router
from app.models.knowledge import Knowledge
from app.schemas.knowledge import KnowledgeCreate, KnowledgeUpdate, KnowledgeResponse

router = create_crud_router(
    model=Knowledge,
    create_schema=KnowledgeCreate,
    update_schema=KnowledgeUpdate,
    response_schema=KnowledgeResponse,
    prefix="/knowledge",
    tags=["knowledge"],
)
