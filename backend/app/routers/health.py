from fastapi import APIRouter, Depends

from app.core.auth import get_current_user

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/protected")
async def health_protected(user_id: str = Depends(get_current_user)) -> dict[str, str]:
    return {"user_id": user_id}