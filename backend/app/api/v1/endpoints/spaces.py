from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models.venues import Space
from app.schemas.space import Space as SpaceSchema

router = APIRouter()

@router.get("/", response_model=List[SpaceSchema])
def read_spaces(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve spaces.
    """
    spaces = db.query(Space).offset(skip).limit(limit).all()
    return spaces
