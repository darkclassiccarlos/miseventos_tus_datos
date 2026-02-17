from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime
import pydantic
PYDANTIC_V2 = pydantic.VERSION.startswith("2.")

if PYDANTIC_V2:
    from pydantic import BaseModel, ConfigDict, field_validator
else:
    from pydantic import BaseModel, validator
from psycopg2.extras import DateTimeTZRange
from app.models.events import EventStatus, RegistrationStatus

# Session Schemas
class SessionBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: EventStatus = EventStatus.DRAFT
    space_id: UUID
    time_range: Any # Handling TSTZRANGE is tricky, usually represented as a list of 2 datetimes or a custom object
    capacity: Optional[int] = None

    if PYDANTIC_V2:
        @field_validator("time_range", mode="before")
        @classmethod
        def parse_time_range(cls, v):
            # Check for SQLAlchemy Range or psycopg2 DateTimeTZRange
            if hasattr(v, "lower") and hasattr(v, "upper") and not callable(v.lower) and not callable(v.upper):
                return [
                    v.lower.isoformat() if v.lower else None,
                    v.upper.isoformat() if v.upper else None
                ]
            return v
    else:
        @validator("time_range", pre=True)
        def parse_time_range(cls, v):
            # Check for SQLAlchemy Range or psycopg2 DateTimeTZRange
            if hasattr(v, "lower") and hasattr(v, "upper") and not callable(v.lower) and not callable(v.upper):
                return [
                    v.lower.isoformat() if v.lower else None,
                    v.upper.isoformat() if v.upper else None
                ]
            return v

class SessionCreate(SessionBase):
    event_id: Optional[UUID] = None

class SessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[EventStatus] = None
    space_id: Optional[UUID] = None
    time_range: Optional[Any] = None
    capacity: Optional[int] = None

class Session(SessionBase):
    id: UUID
    event_id: Optional[UUID] = None
    organizer_id: UUID
    created_at: datetime
    updated_at: datetime
    if PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)
    else:
        class Config:
            orm_mode = True

# Registration Schemas
class RegistrationBase(BaseModel):
    event_id: Optional[UUID] = None
    session_id: Optional[UUID] = None

class RegistrationCreate(RegistrationBase):
    pass

class Registration(RegistrationBase):
    id: UUID
    user_id: UUID
    status: RegistrationStatus
    created_at: datetime
    updated_at: datetime
    if PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)
    else:
        class Config:
            orm_mode = True

# Event Schemas
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: EventStatus = EventStatus.DRAFT
    space_id: Optional[UUID] = None
    time_range: Optional[Any] = None
    capacity: Optional[int] = None

    if PYDANTIC_V2:
        @field_validator("time_range", mode="before")
        @classmethod
        def parse_time_range(cls, v):
            # Check for SQLAlchemy Range or psycopg2 DateTimeTZRange
            if hasattr(v, "lower") and hasattr(v, "upper") and not callable(v.lower) and not callable(v.upper):
                return [
                    v.lower.isoformat() if v.lower else None,
                    v.upper.isoformat() if v.upper else None
                ]
            return v
    else:
        @validator("time_range", pre=True)
        def parse_time_range(cls, v):
            # Check for SQLAlchemy Range or psycopg2 DateTimeTZRange
            if hasattr(v, "lower") and hasattr(v, "upper") and not callable(v.lower) and not callable(v.upper):
                return [
                    v.lower.isoformat() if v.lower else None,
                    v.upper.isoformat() if v.upper else None
                ]
            return v

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[EventStatus] = None
    space_id: Optional[UUID] = None
    time_range: Optional[Any] = None
    capacity: Optional[int] = None

class Event(EventBase):
    id: UUID
    organizer_id: UUID
    created_at: datetime
    updated_at: datetime
    sessions: List[Session] = []
    registrations: List[Registration] = []
    if PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)
    else:
        class Config:
            orm_mode = True

class EventPagination(BaseModel):
    items: List[Event]
    total: int
    page: int
    size: int
    pages: int
