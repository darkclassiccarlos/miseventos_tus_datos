import requests
import random
from faker import Faker
from datetime import datetime, timedelta

fake = Faker()
BASE_URL = "http://localhost:8000/api/v1"

def get_admin_token():
    login_data = {
        "username": "admin@miseventos.com",
        "password": "admin"
    }
    response = requests.post(f"{BASE_URL}/login/access-token", data=login_data)
    response.raise_for_status()
    return response.json()["access_token"]

def get_spaces(token):
    headers = {"Authorization": f"Bearer {token}"}
    # Direct SQL to get spaces if API doesn't have a list yet, but let's assume it does or use the one we know
    # For simplicity, we'll try to find spaces via API or fallback to the ones we inserted
    # In a real scenario, we'd have a GET /spaces/ endpoint
    return [
        "de650993-4a6c-482f-8706-e0e6402280d0" # Falling back to one of the IDs if list fails
    ]

def seed_events():
    try:
        token = get_admin_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get space IDs directly from DB since we are running inside docker
        import psycopg2
        import os
        
        # We'll use the IDs we know or just fetch them if possible
        # Since this script runs inside the backend container, we can use the environment variables
        conn = psycopg2.connect(
            dbname=os.getenv("POSTGRES_DB", "app"),
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD", "postgres"),
            host=os.getenv("POSTGRES_SERVER", "db")
        )
        cur = conn.cursor()
        cur.execute("SELECT id FROM spaces;")
        space_ids = [str(row[0]) for row in cur.fetchall()]
        cur.close()
        conn.close()
        
        if not space_ids:
            print("No spaces found. Seeding aborted.")
            return

        statuses = ["draft", "published", "cancelled"]
        
        for i in range(10):
            start_date = fake.date_time_between(start_date="now", end_date="+30d")
            end_date = start_date + timedelta(hours=random.randint(2, 6))
            
            event_data = {
                "title": fake.catch_phrase(),
                "description": fake.paragraph(),
                "status": random.choice(statuses),
                "capacity": random.randint(10, 200),
                "space_id": random.choice(space_ids),
                "time_range": f"[{start_date.isoformat()}, {end_date.isoformat()}]"
            }
            
            response = requests.post(f"{BASE_URL}/events/", json=event_data, headers=headers)
            if response.status_code == 200:
                print(f"Created event: {event_data['title']}")
            else:
                print(f"Failed to create event {i}: {response.text}")
                
    except Exception as e:
        print(f"Error seeding events: {e}")

if __name__ == "__main__":
    seed_events()
