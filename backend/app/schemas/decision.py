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


class DecisionBase(BaseModel):
    title: str
    background: Optional[str] = None
    options: Optional[dict[str, Any]] = None
    reason: Optional[str] = None
    result: Optional[str] = None
    decision_date: Optional[datetime] = None
    confidence: Optional[int] = None
    status: str = "pending"
    attachments: Optional[list[dict]] = None

    @field_validator("decision_date", mode="before")
    @classmethod
    def parse_decision_date(cls, v):
        return _to_bjt(v)


class DecisionCreate(DecisionBase):
    pass


class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    background: Optional[str] = None
    options: Optional[dict[str, Any]] = None
    reason: Optional[str] = None
    result: Optional[str] = None
    decision_date: Optional[datetime] = None
    confidence: Optional[int] = None
    status: Optional[str] = None
    attachments: Optional[list[dict]] = None


class DecisionResponse(DecisionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
