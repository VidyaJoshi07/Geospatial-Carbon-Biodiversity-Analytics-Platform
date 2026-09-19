from fastapi import APIRouter

from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.projects import router as projects_router
from app.api.sites import router as sites_router
from app.api.users import router as users_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(projects_router)
api_router.include_router(sites_router)
api_router.include_router(analytics_router)
api_router.include_router(users_router)
api_router.include_router(health_router)
