from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.analytics import SiteAnalytics
from app.models.site import Site
from app.models.user import User
from app.schemas.analytics import SiteAnalyticsResponse
from app.schemas.common import ApiResponse
from app.services.analytics_service import AnalyticsService
from app.utils.dependencies import get_current_user

router = APIRouter(tags=["Analytics"])


@router.get("/sites/{site_id}/analytics", response_model=ApiResponse[SiteAnalyticsResponse])
def get_site_analytics(
    site_id: int,
    time_range: str = Query("1Y", pattern="^(7D|30D|3M|6M|1Y|ALL|all|1y|6m|3m|30d|7d)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analytics_resp = AnalyticsService.get_site_analytics(db, site_id, time_range=time_range)
    return ApiResponse(success=True, data=analytics_resp)


@router.get("/analytics/dashboard", response_model=ApiResponse[Dict[str, Any]])
def get_global_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Global analytics across all sites
    total_sites = db.query(Site).count()
    avg_performance = db.query(func.coalesce(func.avg(SiteAnalytics.performance_score), 0.0)).scalar() or 0.0
    avg_ndvi = db.query(func.coalesce(func.avg(SiteAnalytics.vegetation_index), 0.0)).scalar() or 0.0

    # Top performing sites
    sites = db.query(Site).order_by(Site.carbon_value.desc()).limit(5).all()
    top_sites = [
        {
            "id": s.id,
            "name": s.name,
            "project_name": s.project.name if s.project else "",
            "area_hectares": s.area_hectares,
            "carbon_value": s.carbon_value,
            "biodiversity_value": s.biodiversity_value,
        }
        for s in sites
    ]

    return ApiResponse(
        success=True,
        data={
            "total_monitored_sites": total_sites,
            "system_avg_performance": round(float(avg_performance), 1),
            "system_avg_ndvi": round(float(avg_ndvi), 2),
            "top_performing_sites": top_sites,
        },
    )
