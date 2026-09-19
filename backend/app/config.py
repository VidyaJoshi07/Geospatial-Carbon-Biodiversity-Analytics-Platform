import json
import os
import sys
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Darukaa.Earth"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database URL - PostgreSQL + PostGIS required (configurable via DATABASE_URL)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/darukaa_earth"

    # JWT Authentication - must come from environment, no hardcoded default
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*",
    ]

    @field_validator("JWT_SECRET_KEY", mode="after")
    @classmethod
    def validate_jwt_secret_key(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError(
                "JWT_SECRET_KEY is required and cannot be empty. "
                "Set JWT_SECRET_KEY in your environment variables or .env file."
            )
        placeholder_values = [
            "replace_with_a_long_random_secret",
            "replace_with_a_secure_random_secret_key_at_least_32_characters",
        ]
        if v.strip() in placeholder_values:
            raise ValueError(
                "JWT_SECRET_KEY is set to an unconfigured placeholder from .env.example. "
                "Please configure a secure random secret key in your environment variables."
            )
        return v.strip()

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("DATABASE_URL environment variable is required.")
        is_test = (
            os.getenv("TESTING", "").lower() in ("true", "1", "yes")
            or "pytest" in sys.modules
            or os.environ.get("PYTEST_CURRENT_TEST") is not None
        )
        env = os.getenv("ENVIRONMENT", "development").lower()
        if v.strip().startswith("sqlite") and env == "production" and not is_test:
            raise ValueError(
                "SQLite is not supported for Darukaa.Earth production runtime. "
                "PostgreSQL + PostGIS is required in production. "
                "Please configure DATABASE_URL (e.g. postgresql+psycopg2://user:pass@localhost:5432/dbname)."
            )
        return v.strip()

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


try:
    settings = Settings()
except Exception as exc:
    # If settings fail to initialize, print an explicit configuration error
    print(
        f"\n[CONFIGURATION ERROR] Darukaa.Earth failed to initialize settings:\n{exc}\n",
        file=sys.stderr,
    )
    raise
