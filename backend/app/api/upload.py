import os
import re
import uuid
import hashlib

from fastapi import APIRouter, HTTPException, Request, UploadFile, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.api.deps import get_db
from app.models import FileAttachment

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

# 允许的文件类型
ALLOWED_TYPES = {
    # 图片
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    # 文档
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    # 文本
    "text/plain", "text/markdown", "text/csv",
    # 压缩包
    "application/zip", "application/x-rar-compressed", "application/gzip",
    # 代码
    "application/json", "application/javascript", "text/html", "text/css",
    # 其他
    "application/octet-stream",
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def generate_safe_filename(original_filename: str) -> str:
    """
    生成安全的文件名：{hash}_{uuid}_{clean_original_name}.{ext}
    例如：a1b2c3d4_12345678_项目文档.pdf
    """
    if not original_filename:
        return f"file_{uuid.uuid4().hex[:8]}"

    # 生成短hash（用于确保唯一性）
    file_hash = hashlib.md5(original_filename.encode()).hexdigest()[:8]

    # 生成UUID确保唯一性
    unique_id = uuid.uuid4().hex[:8]

    # 清理原始文件名（移除危险字符）
    # 只保留字母、数字、下划线、横线、点、空格
    safe_name = "".join(c for c in original_filename if c.isalnum() or c in '._- ')

    # 移除多余空格
    safe_name = re.sub(r'\s+', ' ', safe_name).strip()

    # 限制文件名长度
    if len(safe_name) > 50:
        name, ext = os.path.splitext(safe_name)
        safe_name = name[:46] + ext

    # 如果清理后文件名为空，使用默认名
    if not safe_name:
        safe_name = "unnamed_file"

    # 提取扩展名
    name, ext = os.path.splitext(safe_name)

    # 确保扩展名安全
    ext = ext.lower()
    if not ext:
        ext = ".bin"

    return f"{file_hash}_{unique_id}_{name}{ext}"


@router.post("/to-entity")
async def upload_to_entity(
    file: UploadFile,
    request: Request,
    entity_type: str = Form(..., description="实体类型"),
    entity_id: int = Form(..., description="实体ID"),
    db: AsyncSession = Depends(get_db)
):
    """上传文件并关联到指定实体"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名为空")

    # 验证实体类型
    from app.models import ENTITY_TYPES
    if entity_type not in ENTITY_TYPES:
        raise HTTPException(status_code=400, detail="无效的实体类型")

    # 检查文件类型（宽松模式：允许所有类型，只警告）
    # if file.content_type and file.content_type not in ALLOWED_TYPES:
    #     raise HTTPException(status_code=400, detail=f"不支持的文件类型: {file.content_type}")

    # 读取文件内容
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小超过 50MB 限制")

    # 生成安全的文件名
    safe_filename = generate_safe_filename(file.filename)
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    # 确保目录存在
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 保存文件（同步IO操作，但只阻塞当前协程，不影响其他请求）
    with open(file_path, "wb") as f:
        f.write(content)

    # 创建文件附件记录（异步DB操作，不阻塞事件循环）
    db_file = FileAttachment(
        entity_type=entity_type,
        entity_id=entity_id,
        original_name=file.filename,
        safe_name=safe_filename,
        file_size=len(content),
        content_type=file.content_type or "application/octet-stream",
        file_path=f"uploads/{safe_filename}"
    )

    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)

    # 构建完整 URL
    base_url = str(request.base_url).rstrip("/")
    return {
        "id": db_file.id,
        "name": file.filename,  # 返回原始文件名，供前端显示
        "safe_name": safe_filename,  # 安全的存储文件名
        "url": f"{base_url}/uploads/{safe_filename}",
        "size": len(content),
        "type": file.content_type or "application/octet-stream",
        "created_at": db_file.created_at.isoformat(),
    }


@router.post("/")
async def upload_file(file: UploadFile, request: Request):
    """上传文件，返回文件信息（不关联实体）。"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名为空")

    # 检查文件类型（宽松模式：允许所有类型，只警告）
    # if file.content_type and file.content_type not in ALLOWED_TYPES:
    #     raise HTTPException(status_code=400, detail=f"不支持的文件类型: {file.content_type}")

    # 读取文件内容
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小超过 50MB 限制")

    # 生成安全的文件名
    safe_filename = generate_safe_filename(file.filename)
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    # 确保目录存在
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 保存文件
    with open(file_path, "wb") as f:
        f.write(content)

    # 构建完整 URL
    base_url = str(request.base_url).rstrip("/")
    return {
        "name": file.filename,  # 返回原始文件名，供前端显示
        "safe_name": safe_filename,  # 安全的存储文件名
        "url": f"{base_url}/uploads/{safe_filename}",
        "size": len(content),
        "type": file.content_type or "application/octet-stream",
    }
