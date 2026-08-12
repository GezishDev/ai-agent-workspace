from collections.abc import AsyncIterator

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
    """Create all tables when running against SQLite (development only).

    In production with PostgreSQL, Alembic migrations are the source of truth.
    This is intentionally a no-op for PostgreSQL.
    """
    if not settings.database_url.startswith("sqlite"):
        return

    from app.infrastructure.database.base import Base  # noqa: PLC0415
    import app.infrastructure.database.models  # noqa: F401, PLC0415

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionFactory() as session:
        yield session