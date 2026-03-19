"""add sso fields to users

Revision ID: 0001_add_sso_fields
Revises:
Create Date: 2026-03-19

Add SSO profile columns to crm_users and make password_hash nullable
to support users who authenticate exclusively via Viettel SSO.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0001_add_sso_fields"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make password_hash nullable (SSO-only users have no local password)
    op.alter_column(
        "crm_users",
        "password_hash",
        existing_type=sa.String(),
        nullable=True,
    )

    # Add SSO profile columns
    op.add_column("crm_users", sa.Column("department_name", sa.String(255), nullable=True))
    op.add_column("crm_users", sa.Column("department_fullname", sa.Text(), nullable=True))
    op.add_column("crm_users", sa.Column("department_id", sa.Integer(), nullable=True))
    op.add_column("crm_users", sa.Column("staff_code", sa.String(50), nullable=True))
    op.add_column("crm_users", sa.Column("company_title", sa.String(255), nullable=True))
    op.add_column("crm_users", sa.Column("phone", sa.String(20), nullable=True))
    op.add_column(
        "crm_users",
        sa.Column(
            "auth_provider",
            sa.String(20),
            nullable=False,
            server_default="local",
        ),
    )


def downgrade() -> None:
    # Remove SSO columns
    op.drop_column("crm_users", "auth_provider")
    op.drop_column("crm_users", "phone")
    op.drop_column("crm_users", "company_title")
    op.drop_column("crm_users", "staff_code")
    op.drop_column("crm_users", "department_id")
    op.drop_column("crm_users", "department_fullname")
    op.drop_column("crm_users", "department_name")

    # Restore password_hash as NOT NULL
    # Note: run this only if all existing users have a password_hash set
    op.alter_column(
        "crm_users",
        "password_hash",
        existing_type=sa.String(),
        nullable=False,
    )
