# Backend Documentation

## Overview
This backend is built with **FastAPI** and integrates with **PostgreSQL**, **Redis**, and **RabbitMQ**.

## Running Locally

### Prerequisites
- Python 3.11+
- Docker Desktop (for dependent services)

### Setup
1. **Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Modify `backend/.env` with your local settings.

3. **Start Infrastructure**:
   Start the database and other services:
   ```bash
   docker compose up -d db redis rabbitmq
   ```

4. **Run Application**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation
Once running, access the interactive API docs at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Project Structure
- `app/main.py`: Entry point
- `app/core/config.py`: Configuration
- `app/core/security.py`: OAuth2 Implementation

## Testing
 
### Unit Testing (Backend)
Run tests using `pytest` inside the backend container:
```bash
docker compose exec backend pytest
```
 
### Integrated Frontend-Backend Testing (Playwright)
Detailed instructions on how to run E2E tests for the authentication flow are located in `frontend/tests/login.spec.ts`.
To run the tests:
`docker compose exec frontend npx playwright test`
Results are saved in `tests/results/`.

### Role-Based Access and Event Management
The system now supports role-based access control (RBAC):
- **Admin**: Full access to all endpoints.
- **Organizer**: Can manage (CRUD) their own events and sessions. Access to the `/organizer/calendar` view.
- **Customer**: Can view published events via the `/events` endpoint.

#### Event Endpoints:
- `GET /api/v1/events/`: List events with filters applied by role.
- `POST /api/v1/events/`: Create a new event (Organizer/Admin only).
- `PUT /api/v1/events/{id}`: Update an event.
- `DELETE /api/v1/events/{id}`: Remove an event.

### Database Seeding
To seed the database with test users (2 organizers, 5 customers), run:
`docker compose exec backend python seed_users.py`
To seed the initial admin user, run:
`docker compose exec backend python seed_admin.py`
 
### Test Database
A dedicated PostgreSQL database named `app_test` is used for unit tests to ensure high-fidelity verification without affecting development data.
