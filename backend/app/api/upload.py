import os
import uuid

from fastapi import APIRouter, HTTPException, Request, UploadFile

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


@router.post("/")
async def upload_file(file: UploadFile, request: Request):
    """上传文件，返回文件信息。"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名为空")

    # 检查文件类型（宽松模式：允许所有类型，只警告）
    # if file.content_type and file.content_type not in ALLOWED_TYPES:
    #     raise HTTPException(status_code=400, detail=f"不支持的文件类型: {file.content_type}")

    # 读取文件内容
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小超过 50MB 限制")

    # 生成唯一文件名
    ext = os.path.splitext(file.filename or "")[1]
    unique_name = f"{uuid.uuid4().hex[:12]}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # 确保目录存在
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 保存文件
    with open(file_path, "wb") as f:
        f.write(content)

    # 构建完整 URL
    base_url = str(request.base_url).rstrip("/")
    return {
        "name": file.filename,
        "url": f"{base_url}/uploads/{unique_name}",
        "size": len(content),
        "type": file.content_type or "application/octet-stream",
    }
