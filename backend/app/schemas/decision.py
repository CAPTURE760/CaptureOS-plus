from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel


class DecisionBase(BaseModel):
    title: str
    background: Optional[str] = None
    options: Optional[dict[str, Any]] = None
    reason: Optional[str] = None
    result: Optional[str] = None
    decision_date: Optional[date] = None
    confidence: Optional[int] = None
    status: str = "pending"


class DecisionCreate(DecisionBase):
    pass


class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    background: Optional[str] = None
    options: Optional[dict[str, Any]] = None
    reason: Optional[str] = None
    result: Optional[str] = None
    decision_date: Optional[date] = None
    confidence: Optional[int] = None
    status: Optional[str] = None


class DecisionResponse(DecisionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
