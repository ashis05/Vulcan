from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str
    allowed_origins: str = "*"
    jwks_cache_ttl_seconds: int = 300
    # Postgres connection string for Alembic / SQLModel (Supabase pooler URI).
    # Optional so the API and its tests run without a database.
    database_url: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()