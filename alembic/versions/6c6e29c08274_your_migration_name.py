"""your_migration_name

Revision ID: 6c6e29c08274
Revises: 3d8afa3d3d80
Create Date: 2026-06-27 12:51:49.075802

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



# revision identifiers, used by Alembic.
revision = '6c6e29c08274'
down_revision = '3d8afa3d3d80'
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass