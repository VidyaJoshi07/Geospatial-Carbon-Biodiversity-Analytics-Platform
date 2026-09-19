import logging
import os
import sys

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

logger = logging.getLogger("darukaa.database")


def is_test_environment() -> bool:
    """Return True only when running under an isolated test runner (e.g. pytest)."""
    return (
        os.getenv("TESTING", "").lower() in ("true", "1", "yes")
        or "pytest" in sys.modules
        or os.environ.get("PYTEST_CURRENT_TEST") is not None
    )


# Flag indicating if the current connection is an isolated test SQLite database
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if is_sqlite and not is_test_environment() and settings.ENVIRONMENT == "production":
    raise RuntimeError(
        f"Database configuration error: '{settings.DATABASE_URL}'. "
        "SQLite is not permitted for Darukaa.Earth in production. "
        "PostgreSQL + PostGIS is required. "
        "Set DATABASE_URL to a valid PostgreSQL connection string "
        "(e.g., postgresql+psycopg2://postgres:postgres@localhost:5432/darukaa_earth)."
    )

# Engine configuration: PostgreSQL + PostGIS in production, SQLite in local development/tests
engine_kwargs = {"pool_pre_ping": True}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def verify_db_connection() -> None:
    """
    Verify that the database is reachable and PostGIS is installed (on PostgreSQL).
    Fails clearly with an actionable error if PostgreSQL is unreachable or PostGIS is missing.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            if not is_sqlite:
                try:
                    version = conn.execute(text("SELECT PostGIS_Version();")).scalar()
                    logger.info(f"Connected to PostgreSQL with PostGIS extension: {version}")
                except Exception as pg_err:
                    logger.error(
                        f"PostgreSQL is connected, but PostGIS extension is missing: {pg_err}. "
                        "Run 'alembic upgrade head' or 'CREATE EXTENSION IF NOT EXISTS postgis;' on the database."
                    )
                    raise RuntimeError(
                        f"PostGIS extension missing on PostgreSQL: {pg_err}. "
                        "PostGIS is required for spatial polygon geometries and area calculations."
                    ) from pg_err
            else:
                logger.info("Connected to local database (SQLite).")
    except RuntimeError:
        raise
    except Exception as exc:
        logger.error(f"Database connection error: Could not connect to {settings.DATABASE_URL}. Details: {exc}")
        raise RuntimeError(
            f"Database connection error: Unable to connect to database at '{settings.DATABASE_URL}'. "
            f"Details: {exc}. "
            "Ensure the database is running, accessible, and DATABASE_URL is properly configured."
        ) from exc


def get_db():
    """FastAPI Dependency for database sessions with automatic commit/rollback."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
