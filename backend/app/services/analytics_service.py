import math
import random
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.analytics import SiteAnalytics
from app.models.site import Site
from app.schemas.analytics import (
    AnalyticsCreate,
    AnalyticsRecord,
    AnalyticsSummary,
    SiteAnalyticsResponse,
)


class AnalyticsService:
    @staticmethod
    def get_site_analytics(
        db: Session,
        site_id: int,
        time_range: str = "1Y",
    ) -> SiteAnalyticsResponse:
        site = db.query(Site).filter(Site.id == site_id).first()
        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site with ID {site_id} not found",
            )

        # Check if site has records. If not, generate realistic starter baseline for demo
        existing_count = db.query(SiteAnalytics).filter(SiteAnalytics.site_id == site_id).count()
        if existing_count == 0:
            AnalyticsService.generate_seed_analytics_for_site(db, site)

        query = db.query(SiteAnalytics).filter(SiteAnalytics.site_id == site_id)

        # Apply date filters
        today = date.today()
        range_upper = time_range.upper()
        if range_upper == "7D":
            query = query.filter(SiteAnalytics.recorded_date >= today - timedelta(days=7))
        elif range_upper == "30D":
            query = query.filter(SiteAnalytics.recorded_date >= today - timedelta(days=30))
        elif range_upper == "3M":
            query = query.filter(SiteAnalytics.recorded_date >= today - timedelta(days=90))
        elif range_upper == "6M":
            query = query.filter(SiteAnalytics.recorded_date >= today - timedelta(days=180))
        elif range_upper == "1Y":
            query = query.filter(SiteAnalytics.recorded_date >= today - timedelta(days=365))
        # "ALL" fetches all records

        records = query.order_by(SiteAnalytics.recorded_date.asc()).all()
        record_schemas = [AnalyticsRecord.model_validate(r) for r in records]

        # Calculate summaries
        if record_schemas:
            first_rec = record_schemas[0]
            latest_rec = record_schemas[-1]

            carbon_growth = (
                ((latest_rec.carbon_value - first_rec.carbon_value) / first_rec.carbon_value * 100.0)
                if first_rec.carbon_value > 0 else 0.0
            )
            bio_growth = (
                ((latest_rec.biodiversity_value - first_rec.biodiversity_value) / first_rec.biodiversity_value * 100.0)
                if first_rec.biodiversity_value > 0 else 0.0
            )

            summary = AnalyticsSummary(
                latest_carbon=latest_rec.carbon_value,
                latest_biodiversity=latest_rec.biodiversity_value,
                latest_ndvi=latest_rec.vegetation_index,
                latest_performance=latest_rec.performance_score,
                carbon_growth_pct=round(carbon_growth, 1),
                biodiversity_growth_pct=round(bio_growth, 1),
                total_records=len(record_schemas),
            )
        else:
            summary = AnalyticsSummary(
                latest_carbon=site.carbon_value,
                latest_biodiversity=site.biodiversity_value,
                latest_ndvi=0.65,
                latest_performance=78.0,
                carbon_growth_pct=0.0,
                biodiversity_growth_pct=0.0,
                total_records=0,
            )

        return SiteAnalyticsResponse(
            site_id=site.id,
            site_name=site.name,
            project_id=site.project_id,
            project_name=site.project.name if site.project else "Unknown",
            area_hectares=site.area_hectares,
            summary=summary,
            time_series=record_schemas,
        )

    @staticmethod
    def create_record(db: Session, site_id: int, req: AnalyticsCreate) -> SiteAnalytics:
        record = SiteAnalytics(
            site_id=site_id,
            recorded_date=req.recorded_date,
            carbon_value=req.carbon_value,
            biodiversity_value=req.biodiversity_value,
            vegetation_index=req.vegetation_index,
            area_change=req.area_change,
            performance_score=req.performance_score,
        )
        db.add(record)
        db.flush()
        return record

    @staticmethod
    def generate_seed_analytics_for_site(db: Session, site: Site, months: int = 14) -> None:
        """Generates realistic time series for demonstration purposes."""
        today = date.today()
        base_carbon = max(50.0, site.carbon_value * 0.7 if site.carbon_value else 120.0)
        base_bio = max(40.0, site.biodiversity_value * 0.75 if site.biodiversity_value else 65.0)

        for i in range(months, -1, -1):
            rec_date = today - timedelta(days=i * 30)
            month_idx = (rec_date.month - 1)
            # Seasonal NDVI oscillation
            seasonal_factor = 0.08 * math.sin(month_idx * math.pi / 6.0)
            ndvi = round(min(0.95, max(0.40, 0.68 + seasonal_factor + (months - i) * 0.01 + random.uniform(-0.02, 0.02))), 2)

            # Gradual carbon sequestration growth
            carbon = round(base_carbon + (months - i) * (site.carbon_value * 0.3 / max(months, 1)) + random.uniform(-5.0, 5.0), 1)

            # Gradual biodiversity recovery
            bio = round(min(100.0, max(0.0, base_bio + (months - i) * (site.biodiversity_value * 0.25 / max(months, 1)) + random.uniform(-2.0, 2.0))), 1)

            # Slight positive area canopy delta
            area_change = round(random.uniform(-0.1, 0.4), 2)

            # Composite performance score
            perf = round(min(100.0, max(50.0, (ndvi * 40.0) + (bio * 0.4) + (carbon / (site.carbon_value or 100.0) * 20.0))), 1)

            entry = SiteAnalytics(
                site_id=site.id,
                recorded_date=rec_date,
                carbon_value=carbon,
                biodiversity_value=bio,
                vegetation_index=ndvi,
                area_change=area_change,
                performance_score=perf,
            )
            db.add(entry)

        db.flush()
