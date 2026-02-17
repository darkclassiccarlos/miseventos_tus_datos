import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, Any

from sqlalchemy import String, ForeignKey, Integer, BigInteger, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, ENUM, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.users import User

class LogEntity(str, Enum):
    EVENT = "event"
    SESSION = "session"
    VENUE = "venue"
    SPACE = "space"
    REGISTRATION = "registration"
    USER = "user"

class ActivityLog(Base):
    __tablename__ = "activity_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    actor_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL")
    )
    entity_type: Mapped[LogEntity] = mapped_column(
        ENUM(LogEntity, name="log_entity", create_type=False), 
        nullable=False
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    meta_data: Mapped[Any] = mapped_column("metadata", JSONB, default={}, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )

    # Relationships
    actor: Mapped[Optional["User"]] = relationship("User")
