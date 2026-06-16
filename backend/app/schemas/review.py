from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel


class ReviewBase(BaseModel):
    title: str
    event_summary: Optional[str] = None
    success_factors: Optional[dict[str, Any]] = None
    failure_factors: Optional[dict[str, Any]] = None
    improvements: Optional[dict[str, Any]] = None
    rating: Optional[int] = None
    period: Optional[str] = None
    review_date: Optional[date] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    title: Optional[str] = None
    event_summary: Optional[str] = None
    success_factors: Optional[dict[str, Any]] = None
    failure_factors: Optional[dict[str, Any]] = None
    improvements: Optional[dict[str, Any]] = None
    rating: Optional[int] = None
    period: Optional[str] = None
    review_date: Optional[date] = None


class ReviewResponse(ReviewBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
