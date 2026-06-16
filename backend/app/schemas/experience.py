from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class ExperienceBase(BaseModel):
    title: str
    summary: Optional[str] = None
    context: Optional[str] = None
    result: Optional[str] = None
    lesson: Optional[str] = None
    event_date: Optional[date] = None


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    context: Optional[str] = None
    result: Optional[str] = None
    lesson: Optional[str] = None
    event_date: Optional[date] = None


class ExperienceResponse(ExperienceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
