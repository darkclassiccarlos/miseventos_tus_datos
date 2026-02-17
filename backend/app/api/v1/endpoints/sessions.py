from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.users import User
from app.models.events import Session as SessionModel, Event as EventModel
from app.schemas.event import Session as SessionSchema, SessionCreate, SessionUpdate
from app.core.utils import validate_event_dates, check_schedule_overlap

from datetime import datetime
from dateutil import parser as date_parser
from psycopg2.extras import DateTimeTZRange

router = APIRouter()

@router.post("/", response_model=SessionSchema)
def create_session(
    *,
    db: Session = Depends(deps.get_db),
    session_in: SessionCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new session.
    Only organizers and admins can create sessions.
    """
    is_admin = any(role.name == "admin" for role in current_user.roles)
    is_organizer = any(role.name == "organizer" for role in current_user.roles)
    
    if not (is_admin or is_organizer):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # verify event exists and user has permission
    if session_in.event_id:
        event = db.query(EventModel).filter(EventModel.id == session_in.event_id).first()
        if not event:
             raise HTTPException(status_code=404, detail="Event not found")
        if not is_admin and event.organizer_id != current_user.id:
             raise HTTPException(status_code=403, detail="Not enough permissions for this event")

    # Validate dates
    start_time = session_in.time_range[0]
    end_time = session_in.time_range[1]
    
    if isinstance(start_time, str):
        start_time = date_parser.parse(start_time)
    if isinstance(end_time, str):
        end_time = date_parser.parse(end_time)
        
    validate_event_dates(start_time, end_time)

    # Validate overlap
    check_schedule_overlap(db, session_in.space_id, start_time, end_time)

    data = session_in.dict()
    data["time_range"] = DateTimeTZRange(start_time, end_time, '[]')
    if "status" in data and data["status"]:
        val = data["status"].value if hasattr(data["status"], "value") else data["status"]
        data["status"] = str(val).lower()

    db_obj = SessionModel(
        **data,
        organizer_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{id}", response_model=SessionSchema)
def read_session(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get session by ID.
    """
    session = db.query(SessionModel).filter(SessionModel.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.put("/{id}", response_model=SessionSchema)
def update_session(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    session_in: SessionUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a session.
    """
    session = db.query(SessionModel).filter(SessionModel.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    is_admin = any(role.name == "admin" for role in current_user.roles)
    if not is_admin and session.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    update_data = session_in.dict(exclude_unset=True)
    
    # Check validations if time/space changed
    new_start = session.time_range.lower
    new_end = session.time_range.upper
    new_space_id = session.space_id
    
    checking_overlap = False
    
    if "time_range" in update_data:
        new_start = update_data["time_range"][0]
        new_end = update_data["time_range"][1]
        
        if isinstance(new_start, str):
            new_start = date_parser.parse(new_start)
        if isinstance(new_end, str):
            new_end = date_parser.parse(new_end)
            
        checking_overlap = True
        validate_event_dates(new_start, new_end)
        update_data["time_range"] = DateTimeTZRange(new_start, new_end, '[]')
        
    if "space_id" in update_data:
        new_space_id = update_data["space_id"]
        checking_overlap = True
        
    if checking_overlap:
        check_schedule_overlap(
            db, 
            new_space_id, 
            new_start, 
            new_end, 
            exclude_session_id=id
        )

    if "status" in update_data and update_data["status"]:
        update_data["status"] = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]
        
    for field, value in update_data.items():
        setattr(session, field, value)
        
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.delete("/{id}", response_model=SessionSchema)
def delete_session(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a session.
    """
    session = db.query(SessionModel).filter(SessionModel.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    is_admin = any(role.name == "admin" for role in current_user.roles)
    if not is_admin and session.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    db.delete(session)
    db.commit()
    return session

@router.get("/event/{event_id}", response_model=List[SessionSchema])
def read_sessions_by_event(
    event_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get sessions for an event.
    """
    sessions = db.query(SessionModel).filter(SessionModel.event_id == event_id).all()
    return sessions
