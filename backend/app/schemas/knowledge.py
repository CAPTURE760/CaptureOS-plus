from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class KnowledgeBase(BaseModel):
    title: str
    content: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    confidence: Optional[float] = None


class KnowledgeCreate(KnowledgeBase):
    pass


class KnowledgeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    confidence: Optional[float] = None


class KnowledgeResponse(KnowledgeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
