from datetime import date, datetime
from typing import List

from pydantic import BaseModel, ConfigDict


class AnalyticsRecord(BaseModel):
    id: int
    site_id: int
    recorded_date: date
    carbon_value: float
    biodiversity_value: float
    vegetation_index: float
    area_change: float
    performance_score: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalyticsCreate(BaseModel):
    recorded_date: date
    carbon_value: float
    biodiversity_value: float
    vegetation_index: float
    area_change: float = 0.0
    performance_score: float


class AnalyticsSummary(BaseModel):
    latest_carbon: float
    latest_biodiversity: float
    latest_ndvi: float
    latest_performance: float
    carbon_growth_pct: float
    biodiversity_growth_pct: float
    total_records: int


class SiteAnalyticsResponse(BaseModel):
    site_id: int
    site_name: str
    project_id: int
    project_name: str
    area_hectares: float
    summary: AnalyticsSummary
    time_series: List[AnalyticsRecord]
