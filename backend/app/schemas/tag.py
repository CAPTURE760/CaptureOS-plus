from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TagBase(BaseModel):
    name: str
    color: Optional[str] = None
    level: int = Field(default=1, ge=1, le=5)
    description: Optional[str] = None


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    level: Optional[int] = Field(default=None, ge=1, le=5)
    description: Optional[str] = None


class TagResponse(TagBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class EntityTagCreate(BaseModel):
    entity_type: str
    entity_id: int
    tag_id: int


class EntityTagResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    tag_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
