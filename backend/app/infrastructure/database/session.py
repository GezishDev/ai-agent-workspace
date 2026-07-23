from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings


settings = get_settings()

_connect_args: dict = {}
if settings.database_url.startswith("postgresql"):
    _connect_args = {"statement_cache_size": 0}
elif settings.database_url.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    connect_args=_connect_args,
)
AsyncSessionFactory = async_sessionmaker(engine, expire_on_commit=False)


async def init_db() -> None:
    """Create all tables if they don't exist (used for SQLite in development)."""
    from app.infrastructure.database.base import Base  # noqa: PLC0415
    import app.infrastructure.database.models  # noqa: F401, PLC0415 – ensure models are registered

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Dynamically check and add missing columns to agent_runs for SQLite
    async with engine.begin() as conn:
        for stmt in [
            "ALTER TABLE agent_runs ADD COLUMN model VARCHAR(50) DEFAULT 'llama-3.3-70b-versatile'",
            "ALTER TABLE agent_runs ADD COLUMN temperature FLOAT DEFAULT 0.7",
            "ALTER TABLE agent_runs ADD COLUMN max_tokens INTEGER DEFAULT 2048"
        ]:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass


async def get_session() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionFactory() as session:
        yield session