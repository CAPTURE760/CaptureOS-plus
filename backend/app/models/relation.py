from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RelationType(Base):
    __tablename__ = "relation_types"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reverse_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    relations: Mapped[list["Relation"]] = relationship(back_populates="relation_type")


class Relation(Base):
    __tablename__ = "relations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    source_type: Mapped[str] = mapped_column(String(50))
    source_id: Mapped[int] = mapped_column()
    target_type: Mapped[str] = mapped_column(String(50))
    target_id: Mapped[int] = mapped_column()
    relation_type_id: Mapped[int] = mapped_column(ForeignKey("relation_types.id"))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    relation_type: Mapped["RelationType"] = relationship(back_populates="relations")
