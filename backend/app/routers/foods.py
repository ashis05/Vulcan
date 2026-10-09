"""Food catalog search — local `foods` (INDB + customs) plus packaged products.

Not an AI route: no quota, but auth is still required. Open Food Facts results
are proxied live (and are not persisted) so attribution stays simple.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text

from app.core.auth import get_current_user
from app.db import create_db_engine
from app.schemas import FoodSearchResult
from app.services import openfoodfacts

router = APIRouter(prefix="/foods", tags=["foods"])


def _search_local(user_id: str, query: str, limit: int) -> list[dict]:
    engine = create_db_engine()
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                select id::text as id, name, serving_description, kcal, protein_g, carbs_g, fat_g, source
                from public.foods
                where (user_id is null or user_id = cast(:user_id as uuid))
                  and lower(name) like :pattern
                order by name
                limit :limit
                """
            ),
            {"user_id": user_id, "pattern": f"%{query.lower()}%", "limit": limit},
        ).all()
    return [dict(row._mapping) for row in rows]


@router.get("/search", response_model=list[FoodSearchResult])
async def search_foods(
    q: str = Query(min_length=2),
    limit: int = Query(default=12, ge=1, le=30),
    user_id: str = Depends(get_current_user),
) -> list[FoodSearchResult]:
    query = q.strip()
    local = _search_local(user_id, query, limit)
    if len(local) >= limit:
        return local

    try:
        remote = await openfoodfacts.search_products(query, limit - len(local))
    except Exception:  # noqa: BLE001 — a third-party outage must not break search
        remote = []

    return local + remote
