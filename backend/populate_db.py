from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.events import Event, EventStatus
from app.models.users import User
from app.models.venues import Space
from app.core.database import Base
from datetime import datetime, timedelta
import uuid

# Use main app database
db_url = "postgresql://postgres:changethis@localhost:5433/app"
engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Ensure tables exist (optional if handled by migrations)
    # Base.metadata.create_all(bind=engine)

    # 1. Get an organizer or admin
    user = db.query(User).filter(User.email == "finaluser@example.com").first()
    if not user:
        user = db.query(User).first()
    
    if not user:
        print("No user found to be organizer.")
        exit(1)

    # 2. Get a space
    space = db.query(Space).first()
    if not space:
        print("No space found. Skipping overlap constraint requirements.")

    # 3. Create a published event for today/tomorrow
    event_title = "Featured Registration Workshop"
    existing_event = db.query(Event).filter(Event.title == event_title).first()
    if not existing_event:
        # Create a range for tomorrow
        start = datetime.now() + timedelta(days=1)
        end = start + timedelta(hours=2)
        # Format for Postgres TSTZRANGE: '[start, end]'
        trange = f"['{start.isoformat()}', '{end.isoformat()}']"
        
        new_event = Event(
            title=event_title,
            description="Learn how to use the new registration system!",
            status=EventStatus.PUBLISHED.value,
            organizer_id=user.id,
            capacity=20,
            space_id=space.id if space else None,
            time_range=trange if space else None
        )
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        print(f"Created event: {new_event.id}")
    else:
        print(f"Event already exists: {existing_event.id}")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
