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


class SolutionBase(BaseModel):
    title: str
    description: Optional[str] = None
    approach: Optional[str] = None
    outcome: Optional[str] = None
    effectiveness: Optional[int] = None
    implemented_date: Optional[datetime] = None
    attachments: Optional[list[dict]] = None

    @field_validator("implemented_date", mode="before")
    @classmethod
    def parse_implemented_date(cls, v):
        return _to_bjt(v)


class SolutionCreate(SolutionBase):

    @field_validator("effectiveness")
    @classmethod
    def validate_effectiveness(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError("有效性必须在 1-5 之间")
        return v


class SolutionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    approach: Optional[str] = None
    outcome: Optional[str] = None
    effectiveness: Optional[int] = None
    implemented_date: Optional[datetime] = None
    attachments: Optional[list[dict]] = None

    @field_validator("effectiveness")
    @classmethod
    def validate_effectiveness(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError("有效性必须在 1-5 之间")
        return v


class SolutionResponse(SolutionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
