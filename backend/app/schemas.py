"""Pydantic models — API request/response bodies and Gemini response schemas.

These double as the Gemini `response_schema`, so field descriptions/constraints
guide the model's structured output.
"""

from typing import Literal

from pydantic import BaseModel, Field

from app.models import EQUIPMENT_TYPES, MUSCLE_GROUPS

MuscleGroupLiteral = Literal[*MUSCLE_GROUPS]
EquipmentLiteral = Literal[*EQUIPMENT_TYPES]


class AnalyzeFoodRequest(BaseModel):
    """Request body for `POST /ai/analyze-food`."""

    photo_path: str = Field(
        description="Storage object path in the private `food-photos` bucket, `{user_id}/{uuid}.jpg`."
    )
    hint: str | None = Field(default=None, description="Optional user note (e.g. 'grilled, no oil').")


class FoodSearchResult(BaseModel):
    """One row in the food catalog / packaged-product search response."""

    id: str
    name: str
    serving_description: str
    kcal: int
    protein_g: float
    carbs_g: float
    fat_g: float
    source: str


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


class ProgramExercise(BaseModel):
    """One prescribed exercise inside a program session."""

    name: str = Field(description="Exercise name; prefer a common, catalog-friendly lift name.")
    sets: int = Field(ge=1, le=10, description="Number of working sets.")
    reps: str = Field(description="Rep target or range as text, e.g. '8-12' or '5'.")
    rpe: float | None = Field(default=None, ge=0, le=10, description="Target RPE if prescribed.")
    rest_seconds: int | None = Field(default=None, ge=0, le=600, description="Rest between sets.")
    notes: str | None = Field(default=None, description="Cues or substitutions for this exercise.")
    primary_muscle: MuscleGroupLiteral | None = Field(
        default=None, description="Main muscle trained (used if the name isn't in the catalog)."
    )
    equipment: EquipmentLiteral | None = Field(
        default=None, description="Equipment needed (used if the name isn't in the catalog)."
    )


class ProgramSession(BaseModel):
    """One training day."""

    day_label: str = Field(description="Short day label, e.g. 'Day 1 – Push'.")
    exercises: list[ProgramExercise] = Field(min_length=1)


class ProgramWeek(BaseModel):
    """One week of sessions."""

    sessions: list[ProgramSession] = Field(min_length=1)


class ProgramPayload(BaseModel):
    """The full structured program (Gemini `response_schema`)."""

    name: str = Field(description="Program name, e.g. '4-Day Upper/Lower Cut'.")
    weeks: list[ProgramWeek] = Field(min_length=1)
    progression_notes: str = Field(default="", description="How to progress week over week.")
    rationale: str = Field(description="Why this program fits the user's goal, history, and constraints.")


class GenerateProgramRequest(BaseModel):
    """Request body for `POST /ai/generate-program`."""

    notes: str | None = Field(default=None, description="Optional user guidance for this program.")
    focus_areas: list[str] = Field(
        default_factory=list, description="Areas to emphasize (e.g. from a physique analysis)."
    )


class ActiveProgram(BaseModel):
    """The user's current active program plus its stored rationale."""

    id: str
    status: str
    rationale: str | None = None
    prompt_version: str | None = None
    created_at: str
    program: ProgramPayload
