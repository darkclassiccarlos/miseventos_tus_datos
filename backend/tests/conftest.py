import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.users import User
from unittest.mock import patch

# Mock Redis at the module level for all tests
from unittest.mock import MagicMock
mock_redis = MagicMock()
# Mock get/set to behave like a dict
redis_dict = {}
def redis_get(key): return redis_dict.get(key)
def redis_set(key, value, **kwargs):
    if kwargs.get("nx") and key in redis_dict: return False
    redis_dict[key] = value
    return True
mock_redis.get = MagicMock(side_effect=redis_get)
mock_redis.set = MagicMock(side_effect=redis_set)
mock_redis.delete = MagicMock(side_effect=lambda key: redis_dict.pop(key, None))

patch("app.core.redis.redis_client", mock_redis).start()
patch("app.core.middleware.idempotency.redis_client", mock_redis).start()

mock_redis_is_valid = patch("app.core.redis.is_token_valid", return_value=True)
mock_redis_set_session = patch("app.core.redis.set_token_session", return_value=True)
mock_redis_remove_session = patch("app.core.redis.remove_token_session", return_value=True)

mock_redis_is_valid.start()
mock_redis_set_session.start()
mock_redis_remove_session.start()

# Use a separate PostgreSQL database for tests to support specialized types (CITEXT, UUID)
SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI.replace(f"/{settings.POSTGRES_DB}", "/app_test")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db() -> Generator:
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(db) -> Generator:
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="module")
def test_user(db) -> User:
    user_in = {
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "Test User",
        "is_active": True
    }
    user = User(
        email=user_in["email"],
        password_hash=get_password_hash(user_in["password"]),
        full_name=user_in["full_name"],
        is_active=user_in["is_active"]
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
@pytest.fixture(scope="module")
def admin_user(db) -> User:
    from app.models.users import Role
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Admin")
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)
    
    user = db.query(User).filter(User.email == "admin@example.com").first()
    if not user:
        user = User(
            email="admin@example.com",
            password_hash=get_password_hash("adminpassword"),
            full_name="Admin User",
            is_active=True,
        )
        user.roles.append(admin_role)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@pytest.fixture(scope="module")
def admin_token_headers(client: TestClient, admin_user: User) -> dict:
    login_data = {
        "username": admin_user.email,
        "password": "adminpassword",
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = r.json()
    a_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {a_token}"}
    return headers
@pytest.fixture(scope="module")
def organizer_user(db) -> User:
    from app.models.users import Role
    organizer_role = db.query(Role).filter(Role.name == "organizer").first()
    if not organizer_role:
        organizer_role = Role(name="organizer", description="Organizer")
        db.add(organizer_role)
        db.commit()
        db.refresh(organizer_role)
    
    user = db.query(User).filter(User.email == "organizer@example.com").first()
    if not user:
        user = User(
            email="organizer@example.com",
            password_hash=get_password_hash("organizerpassword"),
            full_name="Organizer User",
            is_active=True,
        )
        user.roles.append(organizer_role)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@pytest.fixture(scope="module")
def organizer_token_headers(client: TestClient, organizer_user: User) -> dict:
    login_data = {
        "username": organizer_user.email,
        "password": "organizerpassword",
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = r.json()
    a_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {a_token}"}
    return headers
