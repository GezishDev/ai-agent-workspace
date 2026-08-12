"""add model temperature max_tokens to agent_runs

Revision ID: 20260812_0002
Revises: 20260629_0001
Create Date: 2026-08-12 00:02:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260812_0002"
down_revision: str | None = "20260629_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "agent_runs",
        sa.Column(
            "model",
            sa.String(length=50),
            nullable=False,
            server_default="llama-3.3-70b-versatile",
        ),
    )
    op.add_column(
        "agent_runs",
        sa.Column(
            "temperature",
            sa.Float(),
            nullable=False,
            server_default="0.7",
        ),
    )
    op.add_column(
        "agent_runs",
        sa.Column(
            "max_tokens",
            sa.Integer(),
            nullable=False,
            server_default="2048",
        ),
    )


def downgrade() -> None:
    op.drop_column("agent_runs", "max_tokens")
    op.drop_column("agent_runs", "temperature")
    op.drop_column("agent_runs", "model")
