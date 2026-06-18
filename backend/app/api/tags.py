from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.tag import EntityTag, Tag
from app.schemas.tag import EntityTagCreate, EntityTagResponse, TagCreate, TagResponse, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=list[TagResponse])
async def list_tags(db: AsyncSession = Depends(get_db)):
    """只返回活跃的标签"""
    result = await db.execute(select(Tag).where(Tag.is_active == True))
    return result.scalars().all()


@router.get("/all", response_model=list[TagResponse])
async def list_all_tags(db: AsyncSession = Depends(get_db)):
    """返回所有标签（包括已停用的）"""
    result = await db.execute(select(Tag))
    return result.scalars().all()


@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(tag_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.get("/{tag_id}/entity-count")
async def get_tag_entity_count(tag_id: int, db: AsyncSession = Depends(get_db)):
    """获取标签的关联实体数量"""
    result = await db.execute(
        select(func.count(EntityTag.id)).where(EntityTag.tag_id == tag_id)
    )
    count = result.scalar()
    return {"count": count}


@router.post("/", response_model=TagResponse, status_code=201)
async def create_tag(data: TagCreate, db: AsyncSession = Depends(get_db)):
    # 检查是否已存在同名标签（包括已停用的）
    existing = await db.execute(
        select(Tag).where(Tag.name == data.name)
    )
    existing_tag = existing.scalar_one_or_none()

    if existing_tag:
        # 已存在同名标签，重新激活并更新信息
        for field, value in data.model_dump().items():
            setattr(existing_tag, field, value)
        existing_tag.is_active = True
        await db.flush()
        await db.refresh(existing_tag)
        return existing_tag

    # 不存在，创建新标签
    db_tag = Tag(**data.model_dump())
    db.add(db_tag)
    await db.flush()
    await db.refresh(db_tag)
    return db_tag


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(tag_id: int, data: TagUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    db_tag = result.scalar_one_or_none()
    if db_tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(db_tag, field, value)
    await db.flush()
    await db.refresh(db_tag)
    return db_tag


@router.delete("/{tag_id}", status_code=204)
async def delete_tag(tag_id: int, db: AsyncSession = Depends(get_db)):
    """删除标签：有关联则软删除，无关联则物理删除"""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    db_tag = result.scalar_one_or_none()
    if db_tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")

    # 检查关联数量
    count_result = await db.execute(
        select(func.count(EntityTag.id)).where(EntityTag.tag_id == tag_id)
    )
    entity_count = count_result.scalar()

    if entity_count > 0:
        # 有关联，软删除（标记为停用）
        db_tag.is_active = False
    else:
        # 无关联，物理删除
        await db.delete(db_tag)


# Entity-Tag relations
@router.post("/assign", response_model=EntityTagResponse, status_code=201)
async def assign_tag(data: EntityTagCreate, db: AsyncSession = Depends(get_db)):
    db_entity_tag = EntityTag(**data.model_dump())
    db.add(db_entity_tag)
    await db.flush()
    await db.refresh(db_entity_tag)
    return db_entity_tag


@router.get("/entity/{entity_type}", response_model=list[EntityTagResponse])
async def list_entity_tags_by_type(entity_type: str, db: AsyncSession = Depends(get_db)):
    """获取某类型所有实体的标签关系"""
    result = await db.execute(
        select(EntityTag).where(EntityTag.entity_type == entity_type)
    )
    return result.scalars().all()


@router.get("/entity/{entity_type}/{entity_id}", response_model=list[TagResponse])
async def get_entity_tags(entity_type: str, entity_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Tag)
        .join(EntityTag, EntityTag.tag_id == Tag.id)
        .where(EntityTag.entity_type == entity_type, EntityTag.entity_id == entity_id)
    )
    return result.scalars().all()


@router.delete("/unassign/{entity_tag_id}", status_code=204)
async def unassign_tag(entity_tag_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EntityTag).where(EntityTag.id == entity_tag_id))
    db_entity_tag = result.scalar_one_or_none()
    if db_entity_tag is None:
        raise HTTPException(status_code=404, detail="Entity-tag relation not found")
    await db.delete(db_entity_tag)
