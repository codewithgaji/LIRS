"""first schema: departments, users, correspondence, status history, report view

Revision ID: 0001
Revises:
"""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

ROLES = ("admin_officer", "station_manager", "account_officer")
STATUSES = ("pending", "assigned", "under_review", "responded", "closed", "returned")
PRIORITIES = ("low", "normal", "high", "urgent")
DIRECTIONS = ("incoming", "outgoing")


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(120), nullable=False, unique=True),
        sa.Column("code", sa.String(16), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("full_name", sa.String(160), nullable=False),
        sa.Column("email", sa.String(160), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum(*ROLES, native_enum=False, length=32), nullable=False),
        sa.Column(
            "department_id",
            sa.Integer,
            sa.ForeignKey("departments.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("station", sa.String(120), nullable=True),
        # postgres wants true here, the old mysql version used 1
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "correspondence",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("reference_number", sa.String(40), nullable=False, unique=True),
        sa.Column("direction", sa.Enum(*DIRECTIONS, native_enum=False, length=16), nullable=False),
        sa.Column("date_received", sa.Date, nullable=False),
        sa.Column("letter_title", sa.String(255), nullable=False),
        sa.Column("company_name", sa.String(180), nullable=False),
        sa.Column("contact_phone", sa.String(40), nullable=True),
        sa.Column("priority", sa.Enum(*PRIORITIES, native_enum=False, length=16), nullable=False),
        sa.Column("status", sa.Enum(*STATUSES, native_enum=False, length=20), nullable=False),
        sa.Column("admin_officer_id", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("station_manager_id", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("account_officer_id", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column(
            "department_id", sa.Integer, sa.ForeignKey("departments.id", ondelete="SET NULL")
        ),
        sa.Column("remarks", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_correspondence_status", "correspondence", ["status"])
    op.create_index("ix_correspondence_date_received", "correspondence", ["date_received"])
    op.create_index("ix_correspondence_company", "correspondence", ["company_name"])

    op.create_table(
        "correspondence_status_history",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "correspondence_id",
            sa.Integer,
            sa.ForeignKey("correspondence.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("old_status", sa.Enum(*STATUSES, native_enum=False, length=20), nullable=True),
        sa.Column("new_status", sa.Enum(*STATUSES, native_enum=False, length=20), nullable=False),
        sa.Column("changed_by", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("changed_at", sa.DateTime, server_default=sa.func.now()),
    )

    # the database panel and reports use this view, so I create it here too
    op.execute(
        """
        CREATE VIEW v_correspondence_full AS
        SELECT c.id, c.reference_number, c.direction, c.date_received, c.letter_title,
               c.company_name, c.priority, c.status,
               d.name AS department_name,
               ao.full_name AS account_officer_name,
               sm.full_name AS station_manager_name
        FROM correspondence c
        LEFT JOIN departments d ON d.id = c.department_id
        LEFT JOIN users ao ON ao.id = c.account_officer_id
        LEFT JOIN users sm ON sm.id = c.station_manager_id
        """
    )


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS v_correspondence_full")
    op.drop_table("correspondence_status_history")
    op.drop_index("ix_correspondence_company", table_name="correspondence")
    op.drop_index("ix_correspondence_date_received", table_name="correspondence")
    op.drop_index("ix_correspondence_status", table_name="correspondence")
    op.drop_table("correspondence")
    op.drop_table("users")
    op.drop_table("departments")
