from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class FileAttachment(Base):
    """文件附件模型"""
    __tablename__ = "file_attachments"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # project, issue, solution 等
    entity_id = Column(Integer, nullable=False, index=True)  # 关联的实体ID
    original_name = Column(String(255), nullable=False)  # 原始文件名
    safe_name = Column(String(255), nullable=False, unique=True)  # 安全存储的文件名
    file_size = Column(Integer, nullable=False)  # 文件大小（字节）
    content_type = Column(String(100), nullable=False)  # MIME类型
    file_path = Column(String(500), nullable=False)  # 文件在uploads目录中的相对路径
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)  # 软删除标记

    def to_dict(self):
        return {
            "id": self.id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "original_name": self.original_name,
            "safe_name": self.safe_name,
            "file_size": self.file_size,
            "content_type": self.content_type,
            "file_path": self.file_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_active": self.is_active,
            "url": f"/uploads/{self.safe_name}"  # 添加URL字段
        }