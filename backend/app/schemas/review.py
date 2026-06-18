from datetime import date, datetime, timezone, timedelta
from typing import Any, Optional

from pydantic import BaseModel, field_validator


BJT = timezone(timedelta(hours=8))


def _to_bjt(v) -> datetime | None:
    if v is None:
        return None
    if isinstance(v, str):
        v = datetime.fromisoformat(v)
    if isinstance(v, datetime) and v.tzinfo is None:
        return v.replace(tzinfo=BJT)
    return v


class ReviewBase(BaseModel):
    title: str
    event_summary: Optional[str] = None
    success_factors: Optional[dict[str, Any]] = None
    failure_factors: Optional[dict[str, Any]] = None
    improvements: Optional[dict[str, Any]] = None
    rating: Optional[int] = None
    period: Optional[str] = None
    review_date: Optional[datetime] = None

    @field_validator("review_date", mode="before")
    @classmethod
    def parse_review_date(cls, v):
        return _to_bjt(v)


class ReviewCreate(ReviewBase):

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError("评分必须在 1-5 之间")
        return v


class ReviewUpdate(BaseModel):
    title: Optional[str] = None
    event_summary: Optional[str] = None
    success_factors: Optional[dict[str, Any]] = None
    failure_factors: Optional[dict[str, Any]] = None
    improvements: Optional[dict[str, Any]] = None
    rating: Optional[int] = None
    period: Optional[str] = None
    review_date: Optional[datetime] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError("评分必须在 1-5 之间")
        return v


class ReviewResponse(ReviewBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
