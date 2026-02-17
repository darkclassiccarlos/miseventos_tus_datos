import asyncio
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.users import Role, User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
    # 1. Create Roles
    roles = ["admin", "organizer", "client"]
    for role_name in roles:
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            role = Role(name=role_name, description=f"{role_name.capitalize()} role")
            db.add(role)
            db.commit()
            db.refresh(role)
            logger.info(f"Role {role_name} created.")

    # 2. Create Admin User
    admin_email = "admin@miseventos.com"
    user = db.query(User).filter(User.email == admin_email).first()
    if not user:
        user = User(
            email=admin_email,
            full_name="Administrator",
            password_hash=get_password_hash("admin"),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Admin user {admin_email} created.")
        
        # Assign Admin Role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if admin_role:
             # Check if association exists (shouldn't if user is new, but good practice)
            user_role = db.query(UserRole).filter(UserRole.user_id == user.id, UserRole.role_id == admin_role.id).first()
        if not user_role:
                user_role = UserRole(user_id=user.id, role_id=admin_role.id)
                db.add(user_role)
                db.commit()
                logger.info(f"Role admin assigned to {admin_email}.")
    else:
        user.password_hash = get_password_hash("admin")
        db.add(user)
        db.commit()
        logger.info(f"Admin user {admin_email} password reset.")

def main() -> None:
    logger.info("Creating initial data")
    db = SessionLocal()
    try:
        init_db(db)
        logger.info("Initial data created")
    except Exception as e:
        logger.error(f"Error creating initial data: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    main()
