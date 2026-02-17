# MisEventos - Sistema de Gestión de Eventos Corporativos

Sistema completo de gestión de eventos corporativos con autenticación basada en roles, calendario interactivo, y gestión de sesiones.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Estructura de Base de Datos](#-estructura-de-base-de-datos)
- [Datos de Prueba](#-datos-de-prueba)
- [Documentación de API](#-documentación-de-api)
- [Arquitectura de Contenedores](#-arquitectura-de-contenedores)
- [Testing](#-testing)

## ✨ Características

- **Autenticación y Autorización**: OAuth2 con JWT tokens
- **Control de Acceso Basado en Roles (RBAC)**:
  - **Admin**: Gestión completa de usuarios y eventos
  - **Organizer**: Creación y gestión de eventos y sesiones
  - **Customer**: Visualización y registro en eventos
- **Gestión de Eventos**: CRUD completo con filtros y paginación
- **Gestión de Sesiones**: Sesiones anidadas dentro de eventos
- **Calendario Interactivo**: Visualización de eventos y sesiones con FullCalendar
- **Sistema de Registro**: Los usuarios pueden registrarse en eventos
- **Gestión de Espacios**: Asignación de ubicaciones a eventos

## 🛠 Stack Tecnológico

### Backend
- **FastAPI** (Python 3.11): Framework web de alto rendimiento
- **PostgreSQL 15**: Base de datos relacional
- **SQLAlchemy**: ORM para Python
- **Alembic**: Migraciones de base de datos
- **Redis**: Caché y sesiones
- **RabbitMQ**: Message broker para tareas asíncronas
- **Pydantic**: Validación de datos

### Frontend
- **Next.js 16** (React 19): Framework de React con SSR
- **TypeScript**: Tipado estático
- **Material-UI (MUI)**: Componentes de UI
- **FullCalendar**: Calendario interactivo
- **Zustand**: Gestión de estado
- **Axios**: Cliente HTTP

### DevOps
- **Docker & Docker Compose**: Containerización
- **Pytest**: Testing del backend
- **Playwright**: Testing E2E

## 📦 Requisitos Previos

- **Docker Desktop** 4.0+ ([Descargar](https://www.docker.com/products/docker-desktop))
- **Git** 2.0+
- **Node.js** 20+ (solo para desarrollo local sin Docker)
- **Python** 3.11+ (solo para desarrollo local sin Docker)

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/darkclassiccarlos/miseventos_tus_datos.git
cd miseventos_tus_datos
```

### 2. Configurar Variables de Entorno

#### Backend

Crear archivo `backend/.env`:

```env
# Database
POSTGRES_SERVER=db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=app
POSTGRES_PORT=5432

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
```

#### Frontend

Crear archivo `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Levantar los Servicios con Docker

```bash
# Construir y levantar todos los servicios
docker compose up -d --build

# Verificar que todos los contenedores están corriendo
docker compose ps
```

Los servicios estarán disponibles en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

### 4. Inicializar la Base de Datos

```bash
# Crear usuario administrador
docker compose exec backend python seed_admin.py

# (Opcional) Crear usuarios de prueba
docker compose exec backend python seed_users.py
```

### 5. Acceder a la Aplicación

Navega a http://localhost:3000 y usa las siguientes credenciales:

**Admin**:
- Email: `admin@example.com`
- Password: `admin123`

**Organizer** (si ejecutaste seed_users.py):
- Email: `organizer1@example.com`
- Password: `password123`

## 🗄 Estructura de Base de Datos

### DDL - Creación de Tablas

```sql
-- Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Tabla de Relación Usuario-Rol (Many-to-Many)
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Tabla de Espacios
CREATE TABLE spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Eventos
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_range TSTZRANGE NOT NULL,
    space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
    capacity INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Sesiones
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_range TSTZRANGE NOT NULL,
    space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
    capacity INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Registros
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'confirmed',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_time_range ON events USING GIST (time_range);
CREATE INDEX idx_sessions_event ON sessions(event_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
```

### Diagrama de Relaciones

```
users ──┬─── user_roles ─── roles
        │
        ├─── events (organizer_id)
        │      │
        │      ├─── sessions
        │      │
        │      └─── registrations
        │
        └─── registrations
                 │
                 └─── sessions (optional)

spaces ─── events
       └─── sessions
```

## 🎲 Datos de Prueba

### Insertar Roles

```sql
INSERT INTO roles (name) VALUES 
    ('admin'),
    ('organizer'),
    ('customer');
```

### Crear Usuario Admin

```sql
-- Password: admin123 (hashed)
INSERT INTO users (id, email, hashed_password, full_name, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 
     'admin@example.com', 
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MV7skW',
     'Admin User', 
     true);

INSERT INTO user_roles (user_id, role_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 1);
```

### Crear Espacios de Ejemplo

```sql
INSERT INTO spaces (name, location, capacity) VALUES
    ('Auditorio Principal', 'Edificio A - Piso 1', 200),
    ('Sala de Conferencias A', 'Edificio B - Piso 2', 50),
    ('Sala de Reuniones 101', 'Edificio C - Piso 1', 20);
```

### Crear Evento de Ejemplo

```sql
INSERT INTO events (title, description, time_range, space_id, capacity, status, organizer_id) VALUES
    ('Conferencia Anual de Tecnología',
     'Evento anual sobre las últimas tendencias en tecnología',
     '[2026-03-15 09:00:00-05, 2026-03-15 18:00:00-05)',
     (SELECT id FROM spaces WHERE name = 'Auditorio Principal'),
     200,
     'published',
     '550e8400-e29b-41d4-a716-446655440000');
```

## 📚 Documentación de API

### Autenticación

#### POST `/api/v1/login/access-token`
Iniciar sesión y obtener token JWT.

**Request Body**:
```json
{
  "username": "admin@example.com",
  "password": "admin123"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### GET `/api/v1/users/me`
Obtener información del usuario autenticado.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@example.com",
  "full_name": "Admin User",
  "is_active": true,
  "roles": [{"id": 1, "name": "admin"}]
}
```

### Eventos

#### GET `/api/v1/events/`
Listar eventos con filtros y paginación.

**Query Parameters**:
- `page` (int): Número de página (default: 1)
- `size` (int): Elementos por página (default: 10)
- `q` (string): Búsqueda por título o descripción
- `status` (string): Filtrar por estado (draft, published, cancelled)

**Response**:
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Conferencia Anual",
      "description": "Descripción del evento",
      "time_range": ["2026-03-15T09:00:00-05:00", "2026-03-15T18:00:00-05:00"],
      "capacity": 200,
      "status": "published",
      "sessions": []
    }
  ],
  "total": 1,
  "page": 1,
  "size": 10,
  "pages": 1
}
```

#### POST `/api/v1/events/`
Crear un nuevo evento (Solo Organizer/Admin).

**Request Body**:
```json
{
  "title": "Nuevo Evento",
  "description": "Descripción",
  "time_range": ["2026-04-01T10:00:00", "2026-04-01T16:00:00"],
  "space_id": "uuid-del-espacio",
  "capacity": 100,
  "status": "draft"
}
```

#### PUT `/api/v1/events/{event_id}`
Actualizar un evento existente.

#### DELETE `/api/v1/events/{event_id}`
Eliminar un evento.

### Sesiones

#### POST `/api/v1/sessions/`
Crear una sesión dentro de un evento.

**Request Body**:
```json
{
  "event_id": "uuid-del-evento",
  "title": "Sesión de Apertura",
  "description": "Primera sesión del evento",
  "time_range": ["2026-03-15T09:00:00", "2026-03-15T10:00:00"],
  "capacity": 50
}
```

### Registros

#### POST `/api/v1/events/{event_id}/register`
Registrarse en un evento.

**Response**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "event_id": "uuid",
  "status": "confirmed",
  "registered_at": "2026-02-16T23:00:00Z"
}
```

#### DELETE `/api/v1/events/{event_id}/unregister`
Cancelar registro en un evento.

### Administración

#### GET `/api/v1/admin/users/`
Listar todos los usuarios (Solo Admin).

#### PUT `/api/v1/admin/users/{user_id}`
Actualizar usuario y roles (Solo Admin).

**Documentación Completa**: http://localhost:8000/docs

## 🐳 Arquitectura de Contenedores

### Servicios Docker

```yaml
services:
  # Base de datos PostgreSQL
  db:
    image: postgres:15-alpine
    ports: ["5433:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app

  # Redis para caché
  redis:
    image: redis:alpine
    ports: ["6379:6379"]

  # RabbitMQ para mensajería
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports: 
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI

  # Backend FastAPI
  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [db, redis, rabbitmq]
    volumes: [./backend:/app]

  # Frontend Next.js
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
    volumes: 
      - ./frontend:/app
      - /app/node_modules
```

### Comandos Útiles

```bash
# Ver logs de un servicio
docker compose logs -f backend

# Reiniciar un servicio
docker compose restart frontend

# Ejecutar comando en contenedor
docker compose exec backend python seed_admin.py

# Detener todos los servicios
docker compose down

# Limpiar volúmenes (⚠️ elimina datos)
docker compose down -v
```

## 🧪 Testing

### Backend (Pytest)

```bash
# Ejecutar todos los tests
docker compose exec backend pytest

# Tests con cobertura
docker compose exec backend pytest --cov=app

# Test específico
docker compose exec backend pytest tests/api/v1/test_events.py
```

### Frontend (Playwright)

```bash
# Ejecutar tests E2E
docker compose exec frontend npx playwright test

# Modo interactivo
docker compose exec frontend npx playwright test --ui
```

## 📝 Desarrollo Local (Sin Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Asegúrate de tener PostgreSQL, Redis y RabbitMQ corriendo
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y de uso exclusivo para TusDatos.

## 👥 Autores

- **Carlos Bautista** - Desarrollo Full Stack

## 🐛 Reporte de Bugs

Para reportar bugs, por favor abre un issue en GitHub con:
- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si aplica
