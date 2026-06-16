from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, union_all
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.decision import Decision
from app.models.experience import Experience
from app.models.issue import Issue
from app.models.project import Project
from app.models.review import Review

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("/")
async def get_timeline(
    start_date: date | None = None,
    end_date: date | None = None,
    entity_type: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    events = []

    # Projects
    if not entity_type or entity_type == "project":
        query = select(Project)
        if start_date:
            query = query.where(Project.start_date >= start_date)
        if end_date:
            query = query.where(Project.start_date <= end_date)
        result = await db.execute(query)
        for item in result.scalars().all():
            events.append({
                "entity_type": "project",
                "entity_id": item.id,
                "title": item.title,
                "date": item.start_date or item.created_at.date(),
                "status": item.status,
            })

    # Experiences
    if not entity_type or entity_type == "experience":
        query = select(Experience)
        if start_date:
            query = query.where(Experience.event_date >= start_date)
        if end_date:
            query = query.where(Experience.event_date <= end_date)
        result = await db.execute(query)
        for item in result.scalars().all():
            events.append({
                "entity_type": "experience",
                "entity_id": item.id,
                "title": item.title,
                "date": item.event_date or item.created_at.date(),
            })

    # Issues
    if not entity_type or entity_type == "issue":
        query = select(Issue)
        if start_date:
            query = query.where(Issue.discovered_date >= start_date)
        if end_date:
            query = query.where(Issue.discovered_date <= end_date)
        result = await db.execute(query)
        for item in result.scalars().all():
            events.append({
                "entity_type": "issue",
                "entity_id": item.id,
                "title": item.title,
                "date": item.discovered_date or item.created_at.date(),
                "status": item.status,
            })

    # Decisions
    if not entity_type or entity_type == "decision":
        query = select(Decision)
        if start_date:
            query = query.where(Decision.decision_date >= start_date)
        if end_date:
            query = query.where(Decision.decision_date <= end_date)
        result = await db.execute(query)
        for item in result.scalars().all():
            events.append({
                "entity_type": "decision",
                "entity_id": item.id,
                "title": item.title,
                "date": item.decision_date or item.created_at.date(),
            })

    # Reviews
    if not entity_type or entity_type == "review":
        query = select(Review)
        if start_date:
            query = query.where(Review.review_date >= start_date)
        if end_date:
            query = query.where(Review.review_date <= end_date)
        result = await db.execute(query)
        for item in result.scalars().all():
            events.append({
                "entity_type": "review",
                "entity_id": item.id,
                "title": item.title,
                "date": item.review_date or item.created_at.date(),
                "rating": item.rating,
            })

    # Sort by date descending
    events.sort(key=lambda x: x["date"] or date.min, reverse=True)
    return events
