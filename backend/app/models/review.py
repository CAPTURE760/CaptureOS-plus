from datetime import date, datetime

from sqlalchemy import DateTime, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200))
    event_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    success_factors: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    failure_factors: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    improvements: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    rating: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    period: Mapped[str | None] = mapped_column(String(50), nullable=True)
    review_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
