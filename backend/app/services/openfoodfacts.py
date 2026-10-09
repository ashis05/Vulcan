"""Open Food Facts lookup for packaged/barcoded products (server-side proxy).

Open Food Facts is open data under the ODbL — attribute the source. The full
`/cgi/search.pl` and `/api/v2/search` endpoints are frequently unavailable, so we
use the Search-a-licious index for names and fetch each product's nutrition from
the v2 product endpoint. Products without recorded energy are still returned
(0 kcal) so users can find and edit them; per-serving values win when present.
"""

import asyncio

import httpx

OFF_SEARCH_URL = "https://search.openfoodfacts.org/search"
OFF_PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product"
OFF_FIELDS = "code,product_name,brands,serving_size,nutriments"
HEADERS = {"User-Agent": "Vulcan/0.1 (https://github.com/ashis05/Vulcan)"}


def _first_number(*values) -> float | None:
    for value in values:
        if isinstance(value, (int, float)):
            return float(value)
    return None


def _nutrient(nutriments: dict, key: str, per_serving: bool) -> float:
    suffix = "_serving" if per_serving else "_100g"
    value = _first_number(nutriments.get(f"{key}{suffix}"))
    if value is None:
        value = _first_number(nutriments.get(f"{key}_100g"), nutriments.get(key))
    return value or 0.0


def _brand_label(raw) -> str:
    if isinstance(raw, list):
        return (raw[0] if raw else "") or ""
    return (raw or "").split(",")[0].strip()


def _map_product(hit: dict, product: dict) -> dict | None:
    code = str(product.get("code") or hit.get("code") or "").strip()
    name = (product.get("product_name") or hit.get("product_name") or "").strip()
    if not code or not name:
        return None

    brand = _brand_label(product.get("brands") or hit.get("brands"))
    display = name if not brand or brand.lower() in name.lower() else f"{name} ({brand})"

    nutriments = product.get("nutriments") or {}
    serving_size = (product.get("serving_size") or "").strip()
    serving_kcal = _first_number(nutriments.get("energy-kcal_serving"))
    per_serving = serving_kcal is not None and serving_kcal > 0
    kcal = serving_kcal if per_serving else _first_number(nutriments.get("energy-kcal_100g"))

    return {
        "id": f"off-{code}",
        "name": display,
        "serving_description": serving_size or ("1 serving" if per_serving else "100 g"),
        "kcal": round(kcal) if kcal and kcal > 0 else 0,
        "protein_g": round(_nutrient(nutriments, "proteins", per_serving), 1),
        "carbs_g": round(_nutrient(nutriments, "carbohydrates", per_serving), 1),
        "fat_g": round(_nutrient(nutriments, "fat", per_serving), 1),
        "source": "off",
    }


async def search_products(query: str, limit: int = 10) -> list[dict]:
    """Return packaged products for a name query, enriched with nutrition."""
    async with httpx.AsyncClient(timeout=15, headers=HEADERS, follow_redirects=True) as client:
        response = await client.get(
            OFF_SEARCH_URL,
            params={"q": query, "page_size": max(1, limit), "countries_tags": "en:india"},
        )
        response.raise_for_status()
        hits = (response.json().get("hits") or [])[:limit]

        async def fetch(hit: dict) -> dict | None:
            code = str(hit.get("code") or "").strip()
            if not code:
                return None
            try:
                detail = await client.get(
                    f"{OFF_PRODUCT_URL}/{code}.json", params={"fields": OFF_FIELDS}
                )
                if detail.status_code != 200:
                    return _map_product(hit, {})
                return _map_product(hit, detail.json().get("product") or {})
            except Exception:  # noqa: BLE001 — one bad product shouldn't fail the search
                return _map_product(hit, {})

        mapped = await asyncio.gather(*(fetch(hit) for hit in hits))
        return [item for item in mapped if item is not None]
