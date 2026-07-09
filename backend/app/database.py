from collections.abc import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# 异步引擎用于API路由
async_engine = create_async_engine(settings.DATABASE_URL)
async_session = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

# 同步引擎用于文件操作（仅在必要时使用）
sync_engine = create_engine(settings.DATABASE_URL.replace("+asyncpg", ""))
sync_session_factory = sessionmaker(sync_engine)

# 创建Base类
class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """异步Session依赖注入"""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
