from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class SolutionBase(BaseModel):
    title: str
    description: Optional[str] = None
    approach: Optional[str] = None
    outcome: Optional[str] = None
    effectiveness: Optional[int] = None
    implemented_date: Optional[date] = None


class SolutionCreate(SolutionBase):
    pass


class SolutionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    approach: Optional[str] = None
    outcome: Optional[str] = None
    effectiveness: Optional[int] = None
    implemented_date: Optional[date] = None


class SolutionResponse(SolutionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
