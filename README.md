# AI Agent Workspace

A production-style AI agent platform built to demonstrate backend engineering, clean architecture, JWT authentication, LangGraph agent workflows, and modern React. Suitable for professional portfolios and AI engineering job applications.

---

## Features

| Category | Feature |
|---|---|
| **Security** | JWT authentication (HS256, configurable expiry) |
| **Security** | bcrypt password hashing via passlib |
| **Security** | User isolation — users can only access their own runs |
| **Security** | `hashed_password` never returned in API responses |
| **Security** | Uniform auth error messages (no user enumeration) |
| **API** | RESTful versioned routes under `/api/v1` |
| **API** | Pydantic v2 request validation with clear 422 errors |
| **API** | Pagination (`limit` / `offset`) on run history |
| **AI** | LangGraph agent workflow (extensible node graph) |
| **AI** | Async Groq LLM integration (non-blocking event loop) |
| **AI** | Model, temperature, max_tokens per request |
| **Data** | PostgreSQL (production) + SQLite (local dev) |
| **Data** | SQLAlchemy async ORM with repository pattern |
| **Data** | Alembic migrations — reproducible schema changes |
| **Frontend** | React 18 + TypeScript + Vite |
| **Frontend** | Dark/light mode, dashboard, chat interface |
| **Frontend** | Run history, model selection, delete |
| **Frontend** | API client boundary — no fetch logic inside components |
| **Infra** | Docker Compose (PostgreSQL + backend + frontend) |
| **Infra** | Multi-stage frontend Docker build |
| **Tests** | 28 backend tests (unit + integration) via pytest |
| **Tests** | 5 frontend tests via Vitest + Testing Library |

---

## Architecture

```
Browser (React + TypeScript)
       │  HTTPS / Bearer token
       ▼
FastAPI  /api/v1
       │
       ├─ presentation   ← routes, Pydantic schemas, dependency injection
       │
       ├─ application    ← AuthService, AgentService (use cases)
       │
       ├─ domain         ← entities, repository contracts, domain exceptions
       │
       ├─ infrastructure ← SQLAlchemy models, async repositories
       │
       └─ core           ← Settings, JWT helpers, bcrypt
              │
              ▼
     PostgreSQL (Alembic migrations)

LangGraph agent graph (inside AgentService):

  HTTP Request → AgentService.run()
                      │
              StateGraph (AgentState)
                      │
               [respond node]
                 AsyncGroq API
                      │
              Save AgentRun → Repository → DB
```

### Clean Architecture layers

| Layer | Responsibility | Allowed dependencies |
|---|---|---|
| `domain` | Business entities and repository contracts | Nothing (pure Python) |
| `application` | Use cases orchestrating domain logic | `domain`, `core` |
| `infrastructure` | SQLAlchemy, Groq, external adapters | `domain`, `core` |
| `presentation` | FastAPI routes, Pydantic schemas, DI | `application`, `domain` |
| `core` | Settings, JWT, password hashing | Nothing |

---

## Tech Stack

**Backend:** Python 3.12 · FastAPI · Pydantic v2 · SQLAlchemy 2 (async) · Alembic · passlib/bcrypt · python-jose · LangGraph · Groq

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · lucide-react

**Database:** PostgreSQL 16 (production) · SQLite/aiosqlite (local dev)

**Testing:** pytest · pytest-asyncio · httpx (ASGI transport) · Vitest · Testing Library

**Infrastructure:** Docker · Docker Compose

---

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── core/            # Settings, JWT, password hashing
│   │   ├── domain/          # Entities, repository interfaces, exceptions
│   │   ├── application/     # AuthService, AgentService (use cases)
│   │   ├── infrastructure/  # SQLAlchemy models, repositories
│   │   └── presentation/    # FastAPI routes, Pydantic schemas, DI
│   ├── alembic/             # Database migrations
│   ├── tests/               # pytest integration + unit tests
│   └── pyproject.toml
│
├── frontend/
│   └── src/
│       ├── api/             # Typed API client (all fetch logic here)
│       ├── ui/              # React components + tests
│       └── styles.css       # Global styles
│
├── docker-compose.yml
└── .env.example
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | — | Liveness check |
| `POST` | `/api/v1/auth/register` | — | Create account, return JWT |
| `POST` | `/api/v1/auth/login` | — | Authenticate, return JWT |
| `POST` | `/api/v1/agents/runs` | ✅ Bearer | Execute agent, save run |
| `GET` | `/api/v1/agents/runs` | ✅ Bearer | List own runs (paginated) |
| `GET` | `/api/v1/agents/runs/{id}` | ✅ Bearer | Get single run |
| `DELETE` | `/api/v1/agents/runs/{id}` | ✅ Bearer | Delete own run |

Interactive API docs: `http://localhost:8000/docs`

---

## Local Development (without Docker)

### Prerequisites
- Python 3.12+
- Node.js 22+
- A [Groq API key](https://console.groq.com) (free tier available)

### Backend

```bash
cd backend

# Copy and edit the environment file
cp ../.env.example .env
# Set GROQ_API_KEY and a strong JWT_SECRET_KEY

# Install dependencies
pip install -e ".[dev]"

# Start the API server (uses SQLite locally — no PostgreSQL needed)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API available at `http://localhost:8000` · Swagger docs at `/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI available at `http://localhost:5173`

---

## Docker

Start the full stack (PostgreSQL + backend + frontend):

```bash
# Copy environment file and set real values
cp .env.example .env

docker compose up --build
```

- UI: `http://localhost:5173`
- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

Migrations run automatically at backend startup (`alembic upgrade head`).

---

## Testing

### Backend (28 tests)

```bash
cd backend
pip install -e ".[dev]"
pytest -v
```

Covers: registration, duplicate detection, email normalisation, login, invalid credentials, uniform error messages, JWT rejection, unauthenticated access, agent run creation, model params, prompt validation, run listing, pagination, user isolation, cross-user delete prevention, and health check.

### Frontend (5 tests)

```bash
cd frontend
npm test
```

### Production build validation

```bash
cd frontend
npm run build
```

---

## Security Notes

- Never use the example JWT secret (`change-this-to-...`) in production.
- Generate a secure secret: `python -c "import secrets; print(secrets.token_hex(32))"`
- Keep `.env` out of source control (already in `.gitignore`).
- CORS origins are narrow by default — do not set `CORS_ORIGINS=*` with credentials.
- Auth errors return identical messages for unknown users and wrong passwords (prevents user enumeration).
- `hashed_password` is never included in any API response.
- User isolation is enforced at the repository layer — `user_id` is always part of the WHERE clause.

---

## Future Improvements

The following are genuinely not yet implemented:

- **Streaming responses** — real-time token streaming via Server-Sent Events
- **Refresh token rotation** — short-lived access tokens with revocable refresh tokens
- **RAG / retrieval** — vector store integration for document-grounded answers
- **Tool calling** — LangGraph tool nodes (web search, code execution, etc.)
- **Agent memory** — persistent conversation context between runs
- **Rate limiting** — per-user request throttling on auth and agent endpoints
- **Structured logging** — request IDs, correlation tracing, OpenTelemetry
- **Role-based access control** — workspace/project/member models
- **Playwright end-to-end tests** — full browser automation against the UI
- **CI/CD pipeline** — GitHub Actions with lint, test, build, and Docker push
