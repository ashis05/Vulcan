"""Pydantic models — API request/response bodies and Gemini response schemas.

These double as the Gemini `response_schema`, so field descriptions/constraints
guide the model's structured output.
"""

from typing import Literal

from pydantic import BaseModel, Field


class AnalyzeFoodRequest(BaseModel):
    """Request body for `POST /ai/analyze-food`."""

    photo_path: str = Field(
        description="Storage object path in the private `food-photos` bucket, `{user_id}/{uuid}.jpg`."
    )
    hint: str | None = Field(default=None, description="Optional user note (e.g. 'grilled, no oil').")


class FoodEstimate(BaseModel):
    """Gemini's structured estimate for one food photo. The user always confirms/edits."""

    name: str = Field(description="Short, specific dish name, e.g. 'Grilled chicken with rice'.")
    serving_description: str = Field(
        description="Visible portion, e.g. '1 bowl, approx. 350 g'."
    )
    calories: int = Field(ge=0, description="Estimated total energy in kcal for the portion shown.")
    protein_g: float = Field(ge=0, description="Estimated protein in grams.")
    carbs_g: float = Field(ge=0, description="Estimated carbohydrates in grams.")
    fat_g: float = Field(ge=0, description="Estimated fat in grams.")
    confidence: Literal["low", "medium", "high"] = Field(
        description="Honest confidence in the estimate given image clarity and dish ambiguity."
    )
    notes: str = Field(
        default="",
        description="Brief caveats or assumptions (hidden ingredients, oil, portion uncertainty).",
    )
