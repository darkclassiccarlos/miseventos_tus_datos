import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Ensure we use the correct database host when running inside Docker
if 'POSTGRES_SERVER' not in os.environ:
    os.environ['POSTGRES_SERVER'] = 'db'

from app.core.database import Base, engine
from app.models import *

def init_db():
    print("Creating tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully!")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    init_db()
