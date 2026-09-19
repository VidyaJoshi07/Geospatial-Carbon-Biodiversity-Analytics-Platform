"""initial_schema

Revision ID: 001_initial_schema
Revises: None
Create Date: 2026-09-19 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from geoalchemy2 import Geometry

from alembic import op

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable PostGIS extension if running on PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 2. Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='USER'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 3. Projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('project_type', sa.String(length=50), nullable=False, server_default='Mixed'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='Active'),
        sa.Column('total_area', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('carbon_credits', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('biodiversity_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_projects_id'), 'projects', ['id'], unique=False)
    op.create_index(op.f('ix_projects_name'), 'projects', ['name'], unique=False)
    op.create_index(op.f('ix_projects_project_type'), 'projects', ['project_type'], unique=False)
    op.create_index(op.f('ix_projects_status'), 'projects', ['status'], unique=False)

    # 4. Sites table
    geom_col = (
        Geometry(geometry_type='POLYGON', srid=4326)
        if bind.dialect.name == 'postgresql'
        else sa.Text()
    )
    op.create_table(
        'sites',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', geom_col, nullable=False),
        sa.Column('area_hectares', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='Active'),
        sa.Column('carbon_value', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('biodiversity_value', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_sites_id'), 'sites', ['id'], unique=False)
    op.create_index(op.f('ix_sites_name'), 'sites', ['name'], unique=False)
    op.create_index(op.f('ix_sites_project_id'), 'sites', ['project_id'], unique=False)

    # 5. Site Analytics table
    op.create_table(
        'site_analytics',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('recorded_date', sa.Date(), nullable=False),
        sa.Column('carbon_value', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('biodiversity_value', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('vegetation_index', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('area_change', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('performance_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_site_analytics_id'), 'site_analytics', ['id'], unique=False)
    op.create_index(op.f('ix_site_analytics_recorded_date'), 'site_analytics', ['recorded_date'], unique=False)
    op.create_index(op.f('ix_site_analytics_site_id'), 'site_analytics', ['site_id'], unique=False)


def downgrade() -> None:
    op.drop_table('site_analytics')
    op.drop_table('sites')
    op.drop_table('projects')
    op.drop_table('users')
