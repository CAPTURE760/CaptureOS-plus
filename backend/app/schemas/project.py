from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "active"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    priority: str = "中"
    deploy_url: Optional[str] = None
    run_command: Optional[str] = None
    tech_stack: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    priority: Optional[str] = None
    deploy_url: Optional[str] = None
    run_command: Optional[str] = None
    tech_stack: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
