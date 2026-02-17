from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# Create the SQLAlchemy engine
# We use the SQLALCHEMY_DATABASE_URI from settings which is constructed from env vars
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

# Create a local session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for our models to inherit from
class Base(DeclarativeBase):
    pass

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
