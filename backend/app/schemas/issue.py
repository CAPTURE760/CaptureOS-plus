from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class IssueBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "open"
    priority: str = "中"
    root_cause: Optional[str] = None
    discovered_date: Optional[date] = None
    resolved_date: Optional[date] = None


class IssueCreate(IssueBase):
    pass


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    root_cause: Optional[str] = None
    discovered_date: Optional[date] = None
    resolved_date: Optional[date] = None


class IssueResponse(IssueBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
