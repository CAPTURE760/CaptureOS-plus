from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.decision import Decision
from app.models.experience import Experience
from app.models.issue import Issue
from app.models.knowledge import Knowledge
from app.models.project import Project
from app.models.review import Review
from app.models.solution import Solution

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    # Count all entities
    counts = {}
    for name, model in [
        ("projects", Project),
        ("experiences", Experience),
        ("issues", Issue),
        ("solutions", Solution),
        ("knowledge", Knowledge),
        ("decisions", Decision),
        ("reviews", Review),
    ]:
        result = await db.execute(select(func.count(model.id)))
        counts[name] = result.scalar_one()

    # Active issues
    result = await db.execute(
        select(func.count(Issue.id)).where(Issue.status == "open")
    )
    counts["open_issues"] = result.scalar_one()

    # Active projects
    result = await db.execute(
        select(func.count(Project.id)).where(Project.status == "active")
    )
    counts["active_projects"] = result.scalar_one()

    # Recent items (last 5 of each)
    recent = {}
    for name, model, date_field in [
        ("projects", Project, Project.created_at),
        ("experiences", Experience, Experience.created_at),
        ("issues", Issue, Issue.created_at),
        ("solutions", Solution, Solution.created_at),
        ("knowledge", Knowledge, Knowledge.created_at),
        ("decisions", Decision, Decision.created_at),
        ("reviews", Review, Review.created_at),
    ]:
        result = await db.execute(
            select(model).order_by(date_field.desc()).limit(5)
        )
        items = result.scalars().all()
        recent[name] = [
            {"id": item.id, "title": item.title, "created_at": item.created_at.isoformat()}
            for item in items
        ]

    return {
        "counts": counts,
        "recent": recent,
    }
