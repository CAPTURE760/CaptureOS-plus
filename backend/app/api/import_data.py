"""数据导入 API — 从 JSON 文件导入数据，跳过重复项。"""
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models import (
    Project,
    Experience,
    Issue,
    Solution,
    Knowledge,
    Decision,
    Review,
    Tag,
    EntityTag,
    Relation,
    RelationType,
)

router = APIRouter(prefix="/import", tags=["import"])


class ValidationError(BaseModel):
    """单条校验错误详情"""
    entity: str        # 实体类型，如 "issues"
    index: int         # 在数组中的索引（从 0 开始）
    field: str         # 出错字段名
    message: str       # 错误描述


class ImportResult(BaseModel):
    imported: dict[str, int]
    skipped: dict[str, int]
    errors: list[str]
    validation_errors: list[ValidationError] = []


# 各实体必填字段定义
REQUIRED_FIELDS: dict[str, list[str]] = {
    "tags": ["name"],
    "projects": ["title"],
    "experiences": ["title"],
    "issues": ["title"],
    "solutions": ["title"],
    "knowledge": ["title"],
    "decisions": ["title"],
    "reviews": ["title"],
    "relation_types": ["name"],
}

# 各实体合法枚举值
VALID_ENUMS: dict[str, dict[str, list[str]]] = {
    "issues": {
        "status": ["open", "in_progress", "resolved", "closed"],
        "priority": ["紧急", "高", "中", "低"],
    },
    "projects": {
        "status": ["active", "completed", "paused", "cancelled"],
    },
    "knowledge": {
        "status": ["unverified", "verified", "outdated"],
    },
    "decisions": {
        "status": ["pending", "in_progress", "completed", "deprecated"],
        "priority": ["紧急", "高", "中", "低"],
    },
}


def _validate_item(entity_type: str, item: dict, index: int) -> list[ValidationError]:
    """校验单条数据，返回错误列表。"""
    errors = []
    required = REQUIRED_FIELDS.get(entity_type, [])
    enums = VALID_ENUMS.get(entity_type, {})

    # 必填字段校验
    for field in required:
        val = item.get(field)
        if val is None or (isinstance(val, str) and val.strip() == ""):
            errors.append(ValidationError(
                entity=entity_type, index=index, field=field,
                message=f"必填字段 '{field}' 为空",
            ))

    # 枚举值校验
    for field, valid_values in enums.items():
        val = item.get(field)
        if val is not None and val != "" and val not in valid_values:
            errors.append(ValidationError(
                entity=entity_type, index=index, field=field,
                message=f"字段 '{field}' 值 '{val}' 不合法，可选值: {', '.join(valid_values)}",
            ))

    return errors


def _parse_datetime(val: str | None) -> datetime | None:
    """解析 ISO 格式的日期时间字符串。"""
    if not val:
        return None
    try:
        return datetime.fromisoformat(val)
    except (ValueError, TypeError):
        return None


def _strip_auto_fields(row: dict) -> dict:
    """移除数据库自动生成的字段，只保留用户数据。"""
    return {
        k: v for k, v in row.items()
        if k not in ("id", "created_at", "updated_at")
    }


async def _get_existing_titles(db: AsyncSession, model, title_field: str = "title") -> set[str]:
    """获取表中已有的所有 title，用于去重。"""
    result = await db.execute(select(getattr(model, title_field)))
    return {row[0] for row in result.all()}


async def _get_existing_names(db: AsyncSession) -> set[str]:
    """获取已有标签名称。"""
    result = await db.execute(select(Tag.name))
    return {row[0] for row in result.all()}


async def _get_existing_relation_type_names(db: AsyncSession) -> set[str]:
    """获取已有关系类型名称。"""
    result = await db.execute(select(RelationType.name))
    return {row[0] for row in result.all()}


@router.post("/")
async def import_data(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db),
) -> ImportResult:
    """导入 JSON 数据，跳过重复项。

    导入顺序：tags → relation_types → 7个核心实体 → entity_tags → relations

    entity_tags 和 relations 需要 ID 重映射，因为导出文件中的 ID
    可能与数据库已有 ID 冲突。
    """
    data = payload.get("data", {})
    errors: list[str] = []
    imported: dict[str, int] = {}
    skipped: dict[str, int] = {}
    validation_errors: list[ValidationError] = []

    # --- 0. 预校验：检查必填字段和枚举值 ---
    entity_keys = ["tags", "relation_types", "projects", "experiences",
                   "issues", "solutions", "knowledge", "decisions", "reviews"]
    for entity_key in entity_keys:
        items = data.get(entity_key, [])
        for idx, item in enumerate(items):
            validation_errors.extend(_validate_item(entity_key, item, idx))

    # 如果有校验错误，先返回，不执行导入
    if validation_errors:
        return ImportResult(
            imported={k: 0 for k in entity_keys + ["entity_tags", "relations"]},
            skipped={k: 0 for k in entity_keys + ["entity_tags", "relations"]},
            errors=[],
            validation_errors=validation_errors,
        )

    # old_id -> new_id 映射，用于修复 entity_tags 和 relations 的引用
    id_maps: dict[str, dict[int, int]] = {
        "tags": {},
        "projects": {},
        "experiences": {},
        "issues": {},
        "solutions": {},
        "knowledge": {},
        "decisions": {},
        "reviews": {},
        "relation_types": {},
    }

    # --- 1. 导入 tags ---
    existing_tag_names = await _get_existing_names(db)
    tag_imported, tag_skipped = 0, 0
    for item in data.get("tags", []):
        name = item.get("name", "")
        if name in existing_tag_names:
            tag_skipped += 1
            continue
        old_id = item.get("id")
        db_item = Tag(
            name=name,
            color=item.get("color"),
            level=item.get("level", 1),
            description=item.get("description"),
            is_active=item.get("is_active", True),
        )
        db.add(db_item)
        await db.flush()
        await db.refresh(db_item)
        if old_id is not None:
            id_maps["tags"][old_id] = db_item.id
        existing_tag_names.add(name)
        tag_imported += 1
    imported["tags"] = tag_imported
    skipped["tags"] = tag_skipped

    # --- 2. 导入 relation_types ---
    existing_rt_names = await _get_existing_relation_type_names(db)
    rt_imported, rt_skipped = 0, 0
    for item in data.get("relation_types", []):
        name = item.get("name", "")
        if name in existing_rt_names:
            rt_skipped += 1
            continue
        old_id = item.get("id")
        db_item = RelationType(
            name=name,
            description=item.get("description"),
            reverse_name=item.get("reverse_name"),
        )
        db.add(db_item)
        await db.flush()
        await db.refresh(db_item)
        if old_id is not None:
            id_maps["relation_types"][old_id] = db_item.id
        existing_rt_names.add(name)
        rt_imported += 1
    imported["relation_types"] = rt_imported
    skipped["relation_types"] = rt_skipped

    # --- 3. 导入 7 个核心实体 ---
    entity_models = {
        "projects": (Project, "title"),
        "experiences": (Experience, "title"),
        "issues": (Issue, "title"),
        "solutions": (Solution, "title"),
        "knowledge": (Knowledge, "title"),
        "decisions": (Decision, "title"),
        "reviews": (Review, "title"),
    }
    for entity_key, (model, title_field) in entity_models.items():
        try:
            existing_titles = await _get_existing_titles(db, model, title_field)
            items = data.get(entity_key, [])
            ent_imported, ent_skipped = 0, 0
            for item in items:
                title = item.get(title_field, "")
                if title in existing_titles:
                    ent_skipped += 1
                    continue
                old_id = item.get("id")
                row_data = _strip_auto_fields(item)
                # 解析日期字段
                for key, val in row_data.items():
                    if isinstance(val, str) and ("date" in key or "Date" in key):
                        row_data[key] = _parse_datetime(val)
                db_item = model(**row_data)
                db.add(db_item)
                await db.flush()
                await db.refresh(db_item)
                if old_id is not None:
                    id_maps[entity_key][old_id] = db_item.id
                existing_titles.add(title)
                ent_imported += 1
            imported[entity_key] = ent_imported
            skipped[entity_key] = ent_skipped
        except Exception as e:
            errors.append(f"{entity_key}: {str(e)}")
            imported[entity_key] = 0
            skipped[entity_key] = 0

    # --- 4. 导入 entity_tags（需要 ID 重映射）---
    et_imported, et_skipped = 0, 0
    # 获取已有的 entity_tags 用于去重
    existing_et_result = await db.execute(select(EntityTag))
    existing_et_set = {
        (et.entity_type, et.entity_id, et.tag_id) for et in existing_et_result.scalars().all()
    }
    for item in data.get("entity_tags", []):
        entity_type = item.get("entity_type", "")
        old_tag_id = item.get("tag_id")
        new_tag_id = id_maps["tags"].get(old_tag_id, old_tag_id)
        # 重映射 entity_id
        old_entity_id = item.get("entity_id")
        entity_id_map = id_maps.get(entity_type, {})
        new_entity_id = entity_id_map.get(old_entity_id, old_entity_id)
        key = (entity_type, new_entity_id, new_tag_id)
        if key in existing_et_set:
            et_skipped += 1
            continue
        db_item = EntityTag(
            entity_type=entity_type,
            entity_id=new_entity_id,
            tag_id=new_tag_id,
        )
        db.add(db_item)
        await db.flush()
        existing_et_set.add(key)
        et_imported += 1
    imported["entity_tags"] = et_imported
    skipped["entity_tags"] = et_skipped

    # --- 5. 导入 relations（需要 ID 重映射）---
    rel_imported, rel_skipped = 0, 0
    existing_rel_result = await db.execute(select(Relation))
    existing_rel_set = {
        (r.source_type, r.source_id, r.target_type, r.target_id, r.relation_type_id)
        for r in existing_rel_result.scalars().all()
    }
    for item in data.get("relations", []):
        source_type = item.get("source_type", "")
        target_type = item.get("target_type", "")
        old_source_id = item.get("source_id")
        old_target_id = item.get("target_id")
        old_rt_id = item.get("relation_type_id")
        new_source_id = id_maps.get(source_type, {}).get(old_source_id, old_source_id)
        new_target_id = id_maps.get(target_type, {}).get(old_target_id, old_target_id)
        new_rt_id = id_maps["relation_types"].get(old_rt_id, old_rt_id)
        key = (source_type, new_source_id, target_type, new_target_id, new_rt_id)
        if key in existing_rel_set:
            rel_skipped += 1
            continue
        db_item = Relation(
            source_type=source_type,
            source_id=new_source_id,
            target_type=target_type,
            target_id=new_target_id,
            relation_type_id=new_rt_id,
            description=item.get("description"),
        )
        db.add(db_item)
        await db.flush()
        existing_rel_set.add(key)
        rel_imported += 1
    imported["relations"] = rel_imported
    skipped["relations"] = rel_skipped

    await db.commit()

    return ImportResult(imported=imported, skipped=skipped, errors=errors, validation_errors=validation_errors)
