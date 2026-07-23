# AI Agent Workspace

Production foundation for an authenticated AI Agent Workspace built with FastAPI, React, Tailwind CSS, PostgreSQL, LangGraph, LangChain-ready boundaries, JWT authentication, Docker, Clean Architecture, Repository Pattern, type hints, Pydantic schemas, tests, and API documentation.

## Why This Feature Exists

This first feature creates the application foundation. We need a secure, modular baseline before adding high-value agent workflows, because authentication, persistence, API shape, UI structure, and deployment boundaries affect every later feature.

## Architecture

The backend follows Clean Architecture:

- `domain`: enterprise rules and repository contracts. It has no FastAPI, SQLAlchemy, or framework dependency.
- `application`: use cases such as registration, login, and agent execution orchestration.
- `infrastructure`: database models, sessions, migrations, and SQLAlchemy repository implementations.
- `presentation`: FastAPI routes, dependencies, and Pydantic request or response models.
- `core`: cross-cutting settings and security helpers.

The frontend is a Vite React app with Tailwind CSS:

- `src/api`: typed API client.
- `src/ui`: user-facing screens and components.
- `src/test`: test setup.

PostgreSQL is the system of record. Alembic owns schema changes. JWT bearer tokens protect agent endpoints. LangGraph is isolated inside the agent application service so we can later replace the starter response node with real LLM, tool, memory, and workflow nodes without rewriting the API.

## Folder Placement

Backend files live under `backend/` because they deploy as the API service. Frontend files live under `frontend/` because they deploy as the browser app. Root-level Docker and environment files describe how the full system runs together.

## File Guide

- `.env.example`: safe template for required environment variables.
- `.gitignore`: excludes secrets, dependency folders, build output, and caches.
- `docker-compose.yml`: runs PostgreSQL, FastAPI, and React together.
- `backend/Dockerfile`: builds the API container.
- `backend/pyproject.toml`: Python package metadata, runtime dependencies, and test tooling.
- `backend/alembic.ini`: Alembic configuration.
- `backend/alembic/env.py`: loads app metadata and database URL for migrations.
- `backend/alembic/versions/20260629_0001_initial_schema.py`: creates `users` and `agent_runs`.
- `backend/app/main.py`: FastAPI application factory, CORS, and router registration.
- `backend/app/core/config.py`: typed environment settings.
- `backend/app/core/security.py`: password hashing, JWT creation, and JWT decoding.
- `backend/app/domain/entities/user.py`: immutable user entity.
- `backend/app/domain/entities/agent_run.py`: immutable agent run entity.
- `backend/app/domain/exceptions.py`: expected business exceptions.
- `backend/app/domain/repositories/*.py`: repository interfaces.
- `backend/app/application/auth_service.py`: register and login use cases.
- `backend/app/application/agent_service.py`: LangGraph-backed agent run and history use cases.
- `backend/app/infrastructure/database/*.py`: SQLAlchemy base, models, and async sessions.
- `backend/app/infrastructure/repositories/*.py`: PostgreSQL repository adapters.
- `backend/app/presentation/api/dependencies.py`: dependency injection for services and current user.
- `backend/app/presentation/api/v1/router.py`: versioned route composition.
- `backend/app/presentation/api/v1/routes/*.py`: health, auth, and agent endpoints.
- `backend/app/presentation/schemas/*.py`: Pydantic request and response models.
- `backend/tests/test_auth_service.py`: unit tests for authentication rules.
- `frontend/package.json`: frontend dependencies and scripts.
- `frontend/Dockerfile`: builds the web container.
- `frontend/src/api/client.ts`: typed HTTP client.
- `frontend/src/ui/App.tsx`: responsive dark-mode workspace UI.
- `frontend/src/ui/App.test.tsx`: UI smoke test.
- `frontend/src/styles.css`: Tailwind entrypoint and global base styles.

## Function Guide

- `create_app`: creates the FastAPI instance, configures CORS, and mounts API routes.
- `get_settings`: caches validated environment settings.
- `parse_cors_origins`: supports comma-separated or list-based CORS configuration.
- `hash_password`: hashes passwords with bcrypt.
- `verify_password`: checks a raw password against a stored hash.
- `create_access_token`: creates a signed JWT access token with expiry.
- `decode_access_token`: validates a JWT and returns its subject.
- `AuthService.register`: normalizes email, prevents duplicates, hashes the password, creates the user, and returns a token.
- `AuthService.login`: validates credentials and returns a token.
- `AgentService.run`: invokes the LangGraph workflow and stores the run.
- `AgentService.history`: returns recent runs for the current user.
- `AgentService._build_graph`: compiles the starter LangGraph workflow.
- `AgentService._respond`: temporary graph node that will later call model and tool nodes.
- `get_session`: yields an async SQLAlchemy session per request.
- `get_auth_service`: wires auth use cases to the SQLAlchemy user repository.
- `get_agent_service`: wires agent use cases to the SQLAlchemy agent-run repository.
- `get_current_user`: validates bearer token and loads the active user.
- `register`, `login`, `run_agent`, `list_agent_runs`, `health`: HTTP endpoint handlers.
- `apiClient.register`, `apiClient.login`, `apiClient.runAgent`, `apiClient.listAgentRuns`: typed browser API calls.
- `App`: top-level UI state, theme, authentication, and workspace routing.
- `AuthPanel`: login and registration form.
- `Workspace`: prompt runner and recent-run list.

## Run Locally

1. Copy `.env.example` to `.env`.
2. Set a strong `JWT_SECRET_KEY`.
3. Start the stack:

```bash
docker compose up --build
```

4. Apply database migrations from the backend container:

```bash
docker compose exec backend alembic upgrade head
```

5. Open the UI at `http://localhost:5173`.
6. Open API docs at `http://localhost:8000/docs`.

## Test It

Backend:

```bash
cd backend
pip install -e ".[dev]"
pytest
```

Frontend:

```bash
cd frontend
npm install
npm test
npm run build
```

End-to-end manual check:

1. Register with an email and a password of at least 12 characters.
2. Submit an agent prompt.
3. Confirm the new run appears in recent runs.
4. Refresh, log in again, and confirm history loads.

## Security Notes

- Never use the example JWT secret in production.
- Keep `.env` out of source control.
- Use HTTPS in production so bearer tokens are not exposed on the network.
- Use short-lived access tokens and add refresh-token rotation before broad release.
- Run migrations explicitly instead of relying on application startup schema creation.
- Keep CORS origins narrow.

## Common Mistakes

- Forgetting to run Alembic migrations before using auth endpoints.
- Setting `CORS_ORIGINS=*` with credentials enabled.
- Storing JWT tokens in long-lived browser storage without a refresh-token strategy.
- Letting SQLAlchemy models leak into route responses instead of mapping to schemas.
- Putting LangGraph logic directly in route handlers.
- Adding database calls inside React components instead of using the API client boundary.

## Suggested Improvements

- Add refresh tokens with rotation and token revocation.
- Add Alembic migration checks in CI.
- Add rate limiting for auth and agent-run endpoints.
- Add structured logging, request IDs, and OpenTelemetry tracing.
- Replace the starter LangGraph response node with model, memory, retrieval, and tool nodes.
- Add workspace, project, and role-based authorization models.
- Add Playwright browser tests once the UI workflow stabilizes.

