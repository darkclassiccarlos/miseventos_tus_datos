from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.core.security import get_password_hash
from app.models.users import User, Role
from app.schemas import user as user_schema

router = APIRouter()

@router.get("/", response_model=List[user_schema.User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Retrieve users. (Admin only)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/me", response_model=user_schema.User)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.post("/", response_model=user_schema.User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: user_schema.UserCreate,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create new user by admin.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    db_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=user_in.is_active,
    )
    
    if user_in.role_names:
        db_user.roles = []
        for role_name in user_in.role_names:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                db.commit()
                db.refresh(role)
            db_user.roles.append(role)
    else:
        # Default role if none provided
        customer_role = db.query(Role).filter(Role.name == "customer").first()
        if not customer_role:
            customer_role = Role(name="customer")
            db.add(customer_role)
            db.commit()
            db.refresh(customer_role)
        db_user.roles.append(customer_role)
        
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/register", response_model=user_schema.User)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: user_schema.UserCreate,
) -> Any:
    """
    Public registration endpoint.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    db_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True,
    )
    
    # Always assign 'customer' role for public registration
    customer_role = db.query(Role).filter(Role.name == "customer").first()
    if not customer_role:
        customer_role = Role(name="customer")
        db.add(customer_role)
        db.commit()
        db.refresh(customer_role)
    db_user.roles.append(customer_role)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=user_schema.User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: UUID,
    user_in: user_schema.UserUpdate,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Update a user. (Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    
    update_data = user_in.dict(exclude_unset=True)
    if "password" in update_data:
        password_hash = get_password_hash(update_data["password"])
        user.password_hash = password_hash
        del update_data["password"]
    
    if "role_names" in update_data:
        # Replace existing roles
        user.roles = []
        for role_name in update_data["role_names"]:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                db.commit()
                db.refresh(role)
                user.roles.append(role)
            else:
                user.roles.append(role)
        del update_data["role_names"]
        
    for field, value in update_data.items():
        setattr(user, field, value)
        
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", response_model=user_schema.User)
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: UUID,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Delete a user. (Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400, detail="Admin cannot delete themselves"
        )
    db.delete(user)
    db.commit()
    return user
