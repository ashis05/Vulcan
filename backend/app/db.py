"""Database engine/session helpers (SQLModel + SQLAlchemy).

The app itself talks to Supabase over supabase-js for CRUD; these helpers exist
for Alembic and for server-side service/admin queries in later phases.
"""

from functools import lru_cache
from typing import Generator

from sqlalchemy import Engine, create_engine
from sqlmodel import Session

from app.core.config import settings


def normalize_url(url: str) -> str:
    """Map plain Postgres URIs to the installed psycopg (v3) driver."""
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://") :]
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]
    return url


@lru_cache
def create_db_engine() -> Engine:
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set — add it to backend/.env")
    return create_engine(normalize_url(settings.database_url), pool_pre_ping=True)


def get_session() -> Generator[Session, None, None]:
    with Session(create_db_engine()) as session:
        yield session
