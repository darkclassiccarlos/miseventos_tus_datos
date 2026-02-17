import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import String, Boolean, ForeignKey, Integer, Text, DateTime, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, TSTZRANGE, ENUM
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.users import User
from app.models.venues import Space

class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class RegistrationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    WAITLIST = "waitlist"

class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        server_default=func.uuid_generate_v4()
    )
    organizer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="RESTRICT"), 
        nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[EventStatus] = mapped_column(
        ENUM(EventStatus, name="event_status", create_type=False, values_callable=lambda x: [e.value for e in x]), 
        default=EventStatus.DRAFT, 
        nullable=False
    )
    space_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("spaces.id", ondelete="RESTRICT")
    )
    time_range: Mapped[Optional[object]] = mapped_column(TSTZRANGE) # Python type for Range is tricky, usually handled as object or specialized type
    capacity: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    organizer: Mapped["User"] = relationship("User", foreign_keys=[organizer_id])
    space: Mapped[Optional["Space"]] = relationship("Space")
    sessions: Mapped[List["Session"]] = relationship("Session", back_populates="event", cascade="all, delete-orphan")
    registrations: Mapped[List["Registration"]] = relationship("Registration", back_populates="event", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(
            "(time_range IS NULL AND space_id IS NULL) OR (time_range IS NOT NULL AND space_id IS NOT NULL)",
            name="chk_event_space_time"
        ),
        ExcludeConstraint(
            ("space_id", "="),
            ("time_range", "&&"),
            name="ex_events_no_overlap",
            where=(time_range != None)
        ),
        Index("idx_events_organizer_id", "organizer_id"),
        Index("idx_events_status", "status"),
        Index("idx_events_time_range", "time_range", postgresql_using="gist"),
    )

class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        server_default=func.uuid_generate_v4()
    )
    event_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("events.id", ondelete="CASCADE")
    )
    organizer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="RESTRICT"), 
        nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[EventStatus] = mapped_column(
        ENUM(EventStatus, name="event_status", create_type=False, values_callable=lambda x: [e.value for e in x]), 
        default=EventStatus.DRAFT, 
        nullable=False
    )
    space_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("spaces.id", ondelete="RESTRICT"), 
        nullable=False
    )
    time_range: Mapped[object] = mapped_column(TSTZRANGE, nullable=False)
    capacity: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    event: Mapped[Optional["Event"]] = relationship("Event", back_populates="sessions")
    organizer: Mapped["User"] = relationship("User", foreign_keys=[organizer_id])
    space: Mapped["Space"] = relationship("Space")
    registrations: Mapped[List["Registration"]] = relationship("Registration", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        ExcludeConstraint(
            ("space_id", "="),
            ("time_range", "&&"),
            name="ex_sessions_no_overlap"
        ),
        Index("idx_sessions_event_id", "event_id"),
        Index("idx_sessions_space_time", "space_id", "time_range", postgresql_using="gist"),
        Index("idx_sessions_status", "status"),
    )

class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        server_default=func.uuid_generate_v4()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    event_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("events.id", ondelete="CASCADE")
    )
    session_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("sessions.id", ondelete="CASCADE")
    )
    status: Mapped[RegistrationStatus] = mapped_column(
        ENUM(RegistrationStatus, name="registration_status", create_type=False, values_callable=lambda x: [e.value for e in x]), 
        default=RegistrationStatus.PENDING, 
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
    event: Mapped[Optional["Event"]] = relationship("Event", back_populates="registrations")
    session: Mapped[Optional["Session"]] = relationship("Session", back_populates="registrations")

    __table_args__ = (
        CheckConstraint(
            "(event_id IS NOT NULL AND session_id IS NULL) OR (event_id IS NULL AND session_id IS NOT NULL)",
            name="chk_registration_target"
        ),
        Index("ux_reg_user_event", "user_id", "event_id", unique=True, postgresql_where=(event_id != None)),
        Index("ux_reg_user_session", "user_id", "session_id", unique=True, postgresql_where=(session_id != None)),
        Index("idx_reg_status", "status"),
    )
