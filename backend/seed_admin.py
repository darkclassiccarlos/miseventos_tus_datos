import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.users import User, Role

def seed_admin():
    db = SessionLocal()
    try:
        # Check if admin role exists
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", description="Administrator with full access")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            print("Admin role created.")

        # Check if admin user exists
        admin_user = db.query(User).filter(User.email == "admin@miseventos.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@miseventos.com",
                password_hash=get_password_hash("password123"),
                full_name="Admin User",
                is_active=True,
            )
            admin_user.roles.append(admin_role)
            db.add(admin_user)
            db.commit()
            print("Admin user created.")
        else:
            print("Admin user already exists.")
    except Exception as e:
        print(f"Error seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
