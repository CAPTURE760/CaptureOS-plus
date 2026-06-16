from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.models.relation import Relation, RelationType
from app.schemas.relation import (
    RelationCreate,
    RelationResponse,
    RelationTypeCreate,
    RelationTypeResponse,
    RelationWithTypeResponse,
)

router = APIRouter(prefix="/relations", tags=["relations"])


# Relation Types
@router.get("/types/", response_model=list[RelationTypeResponse])
async def list_relation_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RelationType))
    return result.scalars().all()


@router.post("/types/", response_model=RelationTypeResponse, status_code=201)
async def create_relation_type(data: RelationTypeCreate, db: AsyncSession = Depends(get_db)):
    db_type = RelationType(**data.model_dump())
    db.add(db_type)
    await db.flush()
    await db.refresh(db_type)
    return db_type


# Relations
@router.get("/", response_model=list[RelationWithTypeResponse])
async def list_relations(
    source_type: str | None = None,
    source_id: int | None = None,
    target_type: str | None = None,
    target_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Relation).options(selectinload(Relation.relation_type))
    if source_type:
        query = query.where(Relation.source_type == source_type)
    if source_id:
        query = query.where(Relation.source_id == source_id)
    if target_type:
        query = query.where(Relation.target_type == target_type)
    if target_id:
        query = query.where(Relation.target_id == target_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=RelationResponse, status_code=201)
async def create_relation(data: RelationCreate, db: AsyncSession = Depends(get_db)):
    db_relation = Relation(**data.model_dump())
    db.add(db_relation)
    await db.flush()
    await db.refresh(db_relation)
    return db_relation


@router.delete("/{relation_id}", status_code=204)
async def delete_relation(relation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Relation).where(Relation.id == relation_id))
    db_relation = result.scalar_one_or_none()
    if db_relation is None:
        raise HTTPException(status_code=404, detail="Relation not found")
    await db.delete(db_relation)
