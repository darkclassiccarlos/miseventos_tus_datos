from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.users import User

router = APIRouter()

@router.post("/login/access-token")
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token, jti = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    # Store session in Redis
    from app.core.redis import set_token_session
    set_token_session(jti, str(user.id), settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    
    return {
        "access_token": token,
        "token_type": "bearer",
    }

@router.post("/logout")
def logout(
    token: str = Depends(deps.reusable_oauth2),
) -> Any:
    """
    Logout: Invalidate token in Redis
    """
    from jose import jwt
    from app.core.config import settings
    from app.core.redis import remove_token_session
    
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        jti = payload.get("jti")
        if jti:
            remove_token_session(jti)
    except Exception:
        pass
        
    return {"detail": "Successfully logged out"}
