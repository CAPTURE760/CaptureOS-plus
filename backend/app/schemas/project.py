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


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "active"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    @field_validator("start_date", mode="before")
    @classmethod
    def parse_start_date(cls, v):
        return _to_bjt(v)

    @field_validator("end_date", mode="before")
    @classmethod
    def parse_end_date(cls, v):
        return _to_bjt(v)
    priority: str = "中"
    source_url: Optional[str] = None
    github_url: Optional[str] = None
    tool: Optional[str] = None
    run_command: Optional[str] = None
    tech_stack: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: Optional[str] = None
    source_url: Optional[str] = None
    github_url: Optional[str] = None
    tool: Optional[str] = None
    run_command: Optional[str] = None
    tech_stack: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
