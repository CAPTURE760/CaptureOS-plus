from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class RelationTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    reverse_name: Optional[str] = None


class RelationTypeCreate(RelationTypeBase):
    pass


class RelationTypeResponse(RelationTypeBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class RelationBase(BaseModel):
    source_type: str
    source_id: int
    target_type: str
    target_id: int
    relation_type_id: int
    description: Optional[str] = None


class RelationCreate(RelationBase):
    pass


class RelationResponse(RelationBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class RelationWithTypeResponse(RelationResponse):
    relation_type: RelationTypeResponse
