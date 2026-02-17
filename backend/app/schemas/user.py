from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class Role(RoleBase):
    id: int
    
class Role(RoleBase):
    id: int
    
    class Config:
        orm_mode = True

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    role_names: List[str] = ["customer"]

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    role_names: Optional[List[str]] = None

class User(UserBase):
    id: UUID
    roles: List[Role] = []

    class Config:
        orm_mode = True
