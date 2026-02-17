from typing import Optional
from uuid import UUID
import pydantic
PYDANTIC_V2 = pydantic.VERSION.startswith("2.")

if PYDANTIC_V2:
    from pydantic import BaseModel, ConfigDict
else:
    from pydantic import BaseModel

class SpaceBase(BaseModel):
    name: str
    capacity: int

class SpaceCreate(SpaceBase):
    pass

class Space(SpaceBase):
    id: UUID
    venue_id: UUID
    
    if PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)
    else:
        class Config:
            orm_mode = True
