from datetime import date, datetime, timezone, timedelta
from typing import Optional

from pydantic import BaseModel, field_validator

BJT = timezone(timedelta(hours=8))


def _to_bjt(v) -> datetime | None:
    """将无时区的 datetime 视为北京时间，加上时区信息。"""
    if v is None:
        return None
    if isinstance(v, str):
        v = datetime.fromisoformat(v)
    if isinstance(v, datetime) and v.tzinfo is None:
        return v.replace(tzinfo=BJT)
    return v


class IssueBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "open"
    priority: str = "中"
    root_cause: Optional[str] = None
    discovered_date: Optional[datetime] = None
    resolved_date: Optional[date] = None

    @field_validator("discovered_date", mode="before")
    @classmethod
    def parse_discovered_date(cls, v):
        return _to_bjt(v)


class IssueCreate(IssueBase):
    pass


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    root_cause: Optional[str] = None
    discovered_date: Optional[datetime] = None
    resolved_date: Optional[date] = None

    @field_validator("discovered_date", mode="before")
    @classmethod
    def parse_discovered_date(cls, v):
        return _to_bjt(v)


class IssueResponse(IssueBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
