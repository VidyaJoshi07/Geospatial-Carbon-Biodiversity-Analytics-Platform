import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import api_router
from app.config import settings
from app.database import verify_db_connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("darukaa")


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database import is_sqlite, verify_db_connection
    logger.info("Verifying database connection...")
    verify_db_connection()
    if is_sqlite:
        from app.database import Base, engine
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized.")
        try:
            from app.database import SessionLocal
            from app.models.user import User
            with SessionLocal() as db:
                if not db.query(User).first():
                    logger.info("No users found. Seeding initial demo data...")
                    from seed import seed_database
                    seed_database()
        except Exception as seed_err:
            logger.warning(f"Auto-seed skipped or completed: {seed_err}")
    logger.info("Database connection ready.")
    yield
    logger.info("Application shutting down.")


app = FastAPI(
    title="Darukaa.Earth — Geospatial Intelligence Platform",
    description="Production-ready REST API for carbon credit monitoring, biodiversity indexing, and PostGIS polygon management.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standardized Error Responses
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_SERVER_ERROR",
    }
    error_code = code_map.get(exc.status_code, "ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": exc.detail,
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    simplified_errors = [
        {"loc": list(err.get("loc", [])), "msg": err.get("msg", ""), "type": err.get("type", "")}
        for err in errors
    ]
    first_msg = errors[0].get("msg", "Invalid request parameters") if errors else "Validation failed"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": first_msg,
                "details": simplified_errors,
            },
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please try again later.",
            },
        },
    )


# Mount API routes under /api
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "service": "Darukaa.Earth API",
        "status": "online",
        "documentation": "/docs",
        "tagline": "Geospatial Intelligence for Carbon & Biodiversity Projects",
    }
