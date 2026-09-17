"""Service-role Supabase access (server-side only). Never returns the key."""

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

FOOD_BUCKET = "food-photos"


async def download_food_photo(path: str) -> tuple[bytes, str]:
    """Fetch a food photo's bytes with the service role. Returns (bytes, mime)."""
    if not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage is not configured on the server.",
        )
    url = f"{settings.supabase_url}/storage/v1/object/{FOOD_BUCKET}/{path}"
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, headers=headers)
    if response.status_code == 404:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found.")
    response.raise_for_status()
    mime = response.headers.get("content-type", "image/jpeg").split(";")[0].strip()
    return response.content, mime
