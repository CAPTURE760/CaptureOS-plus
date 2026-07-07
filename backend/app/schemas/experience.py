from datetime import date, datetime, timezone, timedelta
from typing import Optional

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


class ExperienceBase(BaseModel):
    title: str
    summary: Optional[str] = None
    context: Optional[str] = None
    result: Optional[str] = None
    lesson: Optional[str] = None
    event_date: Optional[datetime] = None
    attachments: Optional[list[dict]] = None

    @field_validator("event_date", mode="before")
    @classmethod
    def parse_event_date(cls, v):
        return _to_bjt(v)


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    context: Optional[str] = None
    result: Optional[str] = None
    lesson: Optional[str] = None
    event_date: Optional[datetime] = None
    attachments: Optional[list[dict]] = None


class ExperienceResponse(ExperienceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
