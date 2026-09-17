"""Build `app/data/foods_seed.json` from the Anuvaad Indian Nutrient Databank (INDB).

Source (open-access): Indian Nutrient Databank — https://www.anuvaad.org.in/indian-nutrient-databank
Download: https://www.anuvaad.org.in/wp-content/uploads/2020/07/Anuvaad_INDB_2024.11.xlsx
Publication: Vijayakumar A, Dubasi HB, Awasthi A, Jaacks LM. Development of an Indian Food
Composition Database. Current Developments in Nutrition. 2024.

INDB is distributed per 100 g and per serving size. We seed the per-serving values
(what a user actually logs) and keep `servings_unit` as the serving description.
Rows without per-serving figures fall back to per-100 g ("100 g" serving).

Usage:
    python scripts/build_foods_seed.py --input path/to/Anuvaad_INDB.xlsx
    (requires `openpyxl`, a dev-only dependency: pip install openpyxl)
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import openpyxl

DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "app" / "data" / "foods_seed.json"

SHEET = "Sheet1"
SOURCE = "indb"


def _num(value) -> float | None:
    return float(value) if isinstance(value, (int, float)) else None


def _round(value: float, places: int) -> float:
    return round(value + 0.0, places)


def build(input_path: Path) -> list[dict]:
    wb = openpyxl.load_workbook(input_path, read_only=True, data_only=True)
    ws = wb[SHEET]
    rows = ws.iter_rows(values_only=True)
    header = next(rows)
    idx = {name: i for i, name in enumerate(header)}

    foods: list[dict] = []
    seen: set[str] = set()

    for row in rows:
        name = (row[idx["food_name"]] or "").strip()
        if not name:
            continue
        key = name.lower()
        if key in seen:
            continue

        serving_kcal = _num(row[idx["unit_serving_energy_kcal"]])
        if serving_kcal is not None and serving_kcal > 0:
            unit = (row[idx["servings_unit"]] or "").strip()
            serving = f"1 {unit}" if unit else "1 serving"
            kcal = serving_kcal
            protein = _num(row[idx["unit_serving_protein_g"]]) or 0.0
            carbs = _num(row[idx["unit_serving_carb_g"]]) or 0.0
            fat = _num(row[idx["unit_serving_fat_g"]]) or 0.0
        else:
            kcal = _num(row[idx["energy_kcal"]])
            if kcal is None or kcal <= 0:
                continue
            serving = "100 g"
            protein = _num(row[idx["protein_g"]]) or 0.0
            carbs = _num(row[idx["carb_g"]]) or 0.0
            fat = _num(row[idx["fat_g"]]) or 0.0

        seen.add(key)
        foods.append(
            {
                "name": name,
                "serving_description": serving,
                "kcal": int(round(kcal)),
                "protein_g": _round(protein, 1),
                "carbs_g": _round(carbs, 1),
                "fat_g": _round(fat, 1),
                "source": SOURCE,
            }
        )

    foods.sort(key=lambda f: f["name"].lower())
    wb.close()
    return foods


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Path to the INDB .xlsx")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, type=Path)
    args = parser.parse_args()

    foods = build(args.input)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(foods, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"wrote {len(foods)} foods to {args.output}")
    print("sample:", json.dumps(foods[:3], ensure_ascii=False))


if __name__ == "__main__":
    main()
