import httpx
import asyncio

BASE_URL = "http://localhost:8000/api/v1"

async def create_user(client, email, password, full_name, role_names):
    payload = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "role_names": role_names,
        "is_active": True
    }
    try:
        response = await client.post(f"{BASE_URL}/users/", json=payload, timeout=10.0)
        if response.status_code == 200:
            print(f"Success: Created {full_name} ({email}) with roles {role_names}")
        else:
            print(f"Error: Could not create {email}. Status: {response.status_code}, Body: {response.text}")
    except Exception as e:
        print(f"Exception creating {email}: {e}")

async def seed():
    # 2 Organizers
    organizers = [
        ("organizer1@tustados.com", "pass_org1", "Organizer One"),
        ("organizer2@tustados.com", "pass_org2", "Organizer Two"),
    ]
    
    # 5 Customers
    customers = [
        ("customer1@gmail.com", "pass_cust1", "Customer One"),
        ("customer2@gmail.com", "pass_cust2", "Customer Two"),
        ("customer3@gmail.com", "pass_cust3", "Customer Three"),
        ("customer4@gmail.com", "pass_cust4", "Customer Four"),
        ("customer5@gmail.com", "pass_cust5", "Customer Five"),
    ]
    
    async with httpx.AsyncClient() as client:
        print("Seeding Organizers...")
        for email, password, name in organizers:
            await create_user(client, email, password, name, ["organizer"])
            
        print("\nSeeding Customers...")
        for email, password, name in customers:
            await create_user(client, email, password, name, ["customer"])

if __name__ == "__main__":
    asyncio.run(seed())
