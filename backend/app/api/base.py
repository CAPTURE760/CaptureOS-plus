"""Generic CRUD router factory."""
from typing import Any, Generic, Sequence, Type, TypeVar

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.database import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)
ResponseSchemaType = TypeVar("ResponseSchemaType", bound=BaseModel)


def create_crud_router(
    model: Type[ModelType],
    create_schema: Type[CreateSchemaType],
    update_schema: Type[UpdateSchemaType],
    response_schema: Type[ResponseSchemaType],
    prefix: str,
    tags: list[str],
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=tags)

    @router.get("/", response_model=list[response_schema])
    async def list_items(
        skip: int = Query(0, ge=0),
        limit: int = Query(20, ge=1, le=100),
        status: str | None = Query(None),
        priority: str | None = Query(None),
        db: AsyncSession = Depends(get_db),
    ) -> Sequence[ModelType]:
        query = select(model)
        if status is not None and hasattr(model, 'status'):
            query = query.where(model.status == status)
        if priority is not None and hasattr(model, 'priority'):
            query = query.where(model.priority == priority)
        # 默认按创建时间倒序排列（最新的在前面）
        if hasattr(model, 'created_at'):
            query = query.order_by(model.created_at.desc())
        result = await db.execute(query.offset(skip).limit(limit))
        return result.scalars().all()

    @router.get("/{item_id}", response_model=response_schema)
    async def get_item(
        item_id: int,
        db: AsyncSession = Depends(get_db),
    ) -> ModelType:
        result = await db.execute(select(model).where(model.id == item_id))
        item = result.scalar_one_or_none()
        if item is None:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        return item

    @router.post("/", response_model=response_schema, status_code=201)
    async def create_item(
        data: create_schema,
        db: AsyncSession = Depends(get_db),
    ) -> ModelType:
        db_item = model(**data.model_dump())
        db.add(db_item)
        await db.flush()
        await db.refresh(db_item)
        return db_item

    @router.put("/{item_id}", response_model=response_schema)
    async def update_item(
        item_id: int,
        data: update_schema,
        db: AsyncSession = Depends(get_db),
    ) -> ModelType:
        result = await db.execute(select(model).where(model.id == item_id))
        db_item = result.scalar_one_or_none()
        if db_item is None:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_item, field, value)
        await db.flush()
        await db.refresh(db_item)
        return db_item

    @router.delete("/{item_id}", status_code=204)
    async def delete_item(
        item_id: int,
        db: AsyncSession = Depends(get_db),
    ) -> None:
        result = await db.execute(select(model).where(model.id == item_id))
        db_item = result.scalar_one_or_none()
        if db_item is None:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        await db.delete(db_item)

    @router.get("/count/", response_model=dict[str, int])
    async def count_items(
        status: str | None = Query(None),
        priority: str | None = Query(None),
        db: AsyncSession = Depends(get_db),
    ) -> dict[str, int]:
        query = select(func.count(model.id))
        if status is not None and hasattr(model, 'status'):
            query = query.where(model.status == status)
        if priority is not None and hasattr(model, 'priority'):
            query = query.where(model.priority == priority)
        result = await db.execute(query)
        count = result.scalar_one()
        return {"count": count}

    return router
