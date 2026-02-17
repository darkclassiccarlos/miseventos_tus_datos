from sqlalchemy import create_engine, inspect, text
from app.core.database import Base
# Import all models to register them with Base
from app.models.users import User, Role
from app.models.venues import Space
from app.models.events import Event, Session, Registration
import os

db_url = "postgresql://postgres:changethis@localhost:5433/app_test"
engine = create_engine(db_url)

print(f"Creating tables in: {db_url}")
Base.metadata.create_all(bind=engine)

inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables: {tables}")

if "registrations" in tables:
    print("\nColumns in 'registrations':")
    for column in inspector.get_columns("registrations"):
        print(f" - {column['name']}: {column['type']}")

print("\nCustom Types (Enums):")
with engine.connect() as conn:
    result = conn.execute(text("SELECT n.nspname as schema, t.typname as type FROM pg_type t LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE (t.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_catalog.pg_class c WHERE c.oid = t.typrelid)) AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_type el WHERE el.oid = t.typelem AND el.typarray = t.oid) AND n.nspname NOT IN ('pg_catalog', 'information_schema')")).fetchall()
    for row in result:
        print(f" - {row[0]}.{row[1]}")
