"""数据导出 API — 全量导出所有数据为 JSON 下载。"""
import json
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import Response
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

router = APIRouter(prefix="/export", tags=["export"])


def _serialize_row(row: Any) -> dict:
    """将 SQLAlchemy row 对象转为可 JSON 序列化的 dict。"""
    d = {}
    for col in row.__table__.columns:
        val = getattr(row, col.name)
        if isinstance(val, datetime):
            val = val.isoformat()
        elif isinstance(val, date):
            val = val.isoformat()
        d[col.name] = val
    return d


async def _fetch_all(db: AsyncSession, model) -> list[dict]:
    result = await db.execute(select(model))
    return [_serialize_row(r) for r in result.scalars().all()]


@router.get("/")
async def export_all(db: AsyncSession = Depends(get_db)):
    """导出全部数据，返回 JSON 文件下载。"""
    data = {
        "projects": await _fetch_all(db, Project),
        "experiences": await _fetch_all(db, Experience),
        "issues": await _fetch_all(db, Issue),
        "solutions": await _fetch_all(db, Solution),
        "knowledge": await _fetch_all(db, Knowledge),
        "decisions": await _fetch_all(db, Decision),
        "reviews": await _fetch_all(db, Review),
        "tags": await _fetch_all(db, Tag),
        "entity_tags": await _fetch_all(db, EntityTag),
        "relation_types": await _fetch_all(db, RelationType),
        "relations": await _fetch_all(db, Relation),
    }

    payload = {
        "exported_at": datetime.now().isoformat(),
        "version": "1.0",
        "data": data,
    }

    json_bytes = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")

    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=captureos-export.json"},
    )
