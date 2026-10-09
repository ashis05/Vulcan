"""Append-only `ai_calls` logging for cost observability.

Best-effort: a logging failure must never break the request path, so everything
is swallowed and warned.
"""

import logging

from sqlalchemy import text

from app.core.config import settings
from app.db import create_db_engine

logger = logging.getLogger("vulcan.ai")


def log_call(
    user_id: str,
    feature: str,
    status: str,
    *,
    model: str | None = None,
    prompt_tokens: int | None = None,
    output_tokens: int | None = None,
    latency_ms: int | None = None,
    error: str | None = None,
) -> None:
    try:
        engine = create_db_engine()
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    insert into public.ai_calls
                        (user_id, feature, model, prompt_tokens, output_tokens, latency_ms, status, error)
                    values
                        (:user_id, :feature, :model, :prompt_tokens, :output_tokens, :latency_ms, :status, :error)
                    """
                ),
                {
                    "user_id": user_id,
                    "feature": feature,
                    "model": model or settings.gemini_model,
                    "prompt_tokens": prompt_tokens,
                    "output_tokens": output_tokens,
                    "latency_ms": latency_ms,
                    "status": status,
                    "error": error,
                },
            )
    except Exception:  # noqa: BLE001 — logging must never raise
        logger.warning("Failed to write ai_calls row", exc_info=True)
