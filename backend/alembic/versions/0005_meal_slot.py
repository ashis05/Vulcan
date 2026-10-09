"""Phase 3: meals.meal_slot for the diary sections

Adds the breakfast/lunch/dinner/snacks slot that S16 groups by. `0004` creates
`meals` from live SQLModel metadata, so this revision is idempotent: a fresh
database already has the column/constraint, while the existing live database
(created before the column existed) gets them added here.

Revision ID: 0005_meal_slot
Revises: 0004b_exercise_media_backfill
Create Date: 2026-09-17

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = "0005_meal_slot"
down_revision: Union[str, None] = "0004b_exercise_media_backfill"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CHECK_NAME = "meals_meal_slot_check"
CHECK_SQL = "meal_slot in ('breakfast', 'lunch', 'dinner', 'snacks')"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {c["name"] for c in inspector.get_columns("meals")}
    if "meal_slot" not in columns:
        op.add_column(
            "meals",
            sa.Column("meal_slot", sa.Text(), nullable=False, server_default=sa.text("'snacks'")),
        )
    checks = {c["name"] for c in inspector.get_check_constraints("meals")}
    if CHECK_NAME not in checks:
        op.create_check_constraint(CHECK_NAME, "meals", CHECK_SQL)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    checks = {c["name"] for c in inspector.get_check_constraints("meals")}
    if CHECK_NAME in checks:
        op.drop_constraint(CHECK_NAME, "meals", type_="check")
    columns = {c["name"] for c in inspector.get_columns("meals")}
    if "meal_slot" in columns:
        op.drop_column("meals", "meal_slot")
