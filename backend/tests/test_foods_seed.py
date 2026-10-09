import json
from pathlib import Path

SEED = Path(__file__).resolve().parents[1] / "app" / "data" / "foods_seed.json"


def _load() -> list[dict]:
    return json.loads(SEED.read_text(encoding="utf-8"))


def test_seed_has_the_full_indb_recipe_set():
    foods = _load()
    assert len(foods) >= 1000


def test_seed_rows_are_well_formed():
    for item in _load():
        assert item["name"].strip(), "empty name"
        assert item["serving_description"].strip(), f"empty serving for {item['name']}"
        assert item["kcal"] >= 0
        assert item["protein_g"] >= 0
        assert item["carbs_g"] >= 0
        assert item["fat_g"] >= 0
        assert item["source"] == "indb"


def test_seed_names_are_unique_case_insensitively():
    names = [item["name"].lower() for item in _load()]
    assert len(names) == len(set(names))
