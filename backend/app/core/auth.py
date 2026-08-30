import time

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

_jwks: dict | None = None
_jwks_fetched_at: float = 0.0

bearer_scheme = HTTPBearer(auto_error=False)


async def _get_jwks() -> dict:
    global _jwks, _jwks_fetched_at
    now = time.monotonic()
    if _jwks is None or now - _jwks_fetched_at > settings.jwks_cache_ttl_seconds:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
            )
            response.raise_for_status()
        _jwks = response.json()
        _jwks_fetched_at = now
    return _jwks


def _key_for_kid(jwks: dict, kid: str | None):
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            kty = key.get("kty")
            if kty == "EC":
                return jwt.algorithms.ECAlgorithm.from_jwk(key)
            return jwt.algorithms.RSAAlgorithm.from_jwk(key)
    raise ValueError("No matching JWK for token kid")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        jwks = await _get_jwks()
        public_key = _key_for_kid(jwks, header.get("kid"))
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            options={"require": ["exp", "sub"]},
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return payload["sub"]