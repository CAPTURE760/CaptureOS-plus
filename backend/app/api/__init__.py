from fastapi import APIRouter

from app.api.projects import router as projects_router
from app.api.experiences import router as experiences_router
from app.api.issues import router as issues_router
from app.api.solutions import router as solutions_router
from app.api.knowledge import router as knowledge_router
from app.api.decisions import router as decisions_router
from app.api.reviews import router as reviews_router
from app.api.tags import router as tags_router
from app.api.relations import router as relations_router
from app.api.search import router as search_router
from app.api.timeline import router as timeline_router
from app.api.dashboard import router as dashboard_router
from app.api.suggestions import router as suggestions_router
from app.api.export import router as export_router
from app.api.import_data import router as import_router
from app.api.export_word import router as export_word_router

api_router = APIRouter()

api_router.include_router(projects_router)
api_router.include_router(experiences_router)
api_router.include_router(issues_router)
api_router.include_router(solutions_router)
api_router.include_router(knowledge_router)
api_router.include_router(decisions_router)
api_router.include_router(reviews_router)
api_router.include_router(tags_router)
api_router.include_router(relations_router)
api_router.include_router(search_router)
api_router.include_router(timeline_router)
api_router.include_router(dashboard_router)
api_router.include_router(suggestions_router)
api_router.include_router(export_router)
api_router.include_router(import_router)
api_router.include_router(export_word_router)
