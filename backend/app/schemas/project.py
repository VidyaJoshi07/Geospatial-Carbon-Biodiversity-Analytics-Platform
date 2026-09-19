from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.project import ProjectStatus, ProjectType
from app.schemas.common import PaginationMeta


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    project_type: ProjectType = ProjectType.MIXED
    status: ProjectStatus = ProjectStatus.ACTIVE
    total_area: Optional[float] = 0.0
    carbon_credits: Optional[float] = 0.0
    biodiversity_score: Optional[float] = 0.0


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    project_type: Optional[ProjectType] = None
    status: Optional[ProjectStatus] = None
    total_area: Optional[float] = None
    carbon_credits: Optional[float] = None
    biodiversity_score: Optional[float] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    project_type: ProjectType
    status: ProjectStatus
    total_area: float
    carbon_credits: float
    biodiversity_score: float
    created_by: int
    created_at: datetime
    updated_at: datetime
    site_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class ProjectListResponse(BaseModel):
    items: List[ProjectResponse]
    pagination: PaginationMeta


class ProjectStats(BaseModel):
    total_projects: int
    active_projects: int
    total_sites: int
    total_area: float
    total_carbon_credits: float
    avg_biodiversity_score: float
