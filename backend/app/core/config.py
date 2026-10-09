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
    # Flash-Lite is the reliable free-tier vision model; override with GEMINI_MODEL.
    gemini_model: str = "gemini-3.1-flash-lite"

    # Per-feature free-tier quotas (PLAN.md §7). Set QUOTA_ENABLED=false to disable
    # all AI quota enforcement (dev/testing) — counters still record for analytics.
    quota_enabled: bool = True
    quota_food_per_day: int = 5
    quota_program_per_days: int = 7
    quota_physique_per_days: int = 7

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
