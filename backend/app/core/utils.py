from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, cast
from sqlalchemy.dialects.postgresql import TSTZRANGE
from psycopg2.extras import DateTimeTZRange

from app.models.events import Event, Session as SessionModel

def validate_event_dates(start_time: datetime, end_time: datetime) -> None:
    """
    Validates that:
    1. start_time is in the future
    2. start_time is not 'today' (must be at least tomorrow)
    3. end_time is after start_time
    4. start_time and end_time are on the same day
    """
    now = datetime.now(start_time.tzinfo)
    
    # Check if start_time is in the future
    if start_time <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event start time must be in the future"
        )

    # Check if start_time is at least tomorrow (not today)
    # We compare the year/month/day
    if start_time.date() <= now.date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Events cannot be scheduled for the current day. They must be scheduled at least one day in advance."
        )

    # Check if end_time is after start_time
    if end_time <= start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event end time must be after start time"
        )

    # Check if start_time and end_time are on the same day
    if start_time.date() != end_time.date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Events must start and end on the same day"
        )

def check_schedule_overlap(
    db: Session,
    space_id: UUID,
    start_time: datetime,
    end_time: datetime,
    exclude_event_id: Optional[UUID] = None,
    exclude_session_id: Optional[UUID] = None
) -> None:
    """
    Checks if the given time range overlaps with any existing Event or Session in the same Space.
    Raises HTTPException if overlap is found.
    """
    # Create Postgres Range for comparison
    # bounds='[]' means inclusive, but [) is clearer for time ranges. 
    # psycopg2 DateTimeTZRange usually defaults to '[)'
    new_range = DateTimeTZRange(start_time, end_time, '[]')

    # 1. Check overlaps with Events
    event_query = db.query(Event).filter(
        Event.space_id == space_id,
        Event.time_range.op("&&")(new_range),
        Event.status != "cancelled" # Ignore cancelled events
    )
    
    if exclude_event_id:
        event_query = event_query.filter(Event.id != exclude_event_id)

    overlapping_event = event_query.first()
    if overlapping_event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Time overlaps with existing event: {overlapping_event.title}"
        )

    # 2. Check overlaps with Sessions
    session_query = db.query(SessionModel).filter(
        SessionModel.space_id == space_id,
        SessionModel.time_range.op("&&")(new_range),
        SessionModel.status != "cancelled"
    )

    if exclude_session_id:
        session_query = session_query.filter(SessionModel.id != exclude_session_id)

    overlapping_session = session_query.first()
    if overlapping_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Time overlaps with existing session: {overlapping_session.title}"
        )
