from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str
    allowed_origins: str = "*"
    jwks_cache_ttl_seconds: int = 300
    # Postgres connection string for Alembic / SQLModel (Supabase pooler URI).
    # Optional so the API and its tests run without a database.
    database_url: str | None = None

    # Phase 4+ AI layer. Server-side secrets — never returned or logged.
    supabase_service_role_key: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"

    # Per-feature free-tier quotas (PLAN.md §7).
    quota_food_per_day: int = 5
    quota_program_per_days: int = 7
    quota_physique_per_days: int = 7

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
