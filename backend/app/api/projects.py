import math
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginationMeta
from app.schemas.project import (
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectStats,
    ProjectUpdate,
)
from app.schemas.site import SiteResponse
from app.services.project_service import ProjectService
from app.utils.dependencies import get_current_user, require_admin
from app.utils.geo import to_geojson_dict

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ApiResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
def create_project(
    req: ProjectCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    project = ProjectService.create_project(db, req, admin)
    resp = ProjectResponse.model_validate(project)
    resp.site_count = len(project.sites) if project.sites else 0
    return ApiResponse(success=True, data=resp)


@router.get("/stats", response_model=ApiResponse[ProjectStats])
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stats = ProjectService.get_dashboard_stats(db)
    return ApiResponse(success=True, data=stats)


@router.get("", response_model=ApiResponse[ProjectListResponse])
def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    project_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects, total = ProjectService.list_projects(
        db=db,
        page=page,
        limit=limit,
        status_filter=status,
        type_filter=project_type,
        search=search,
    )

    items = []
    for p in projects:
        item = ProjectResponse.model_validate(p)
        item.site_count = len(p.sites) if p.sites else 0
        items.append(item)

    pagination = PaginationMeta(
        total=total,
        page=page,
        limit=limit,
        total_pages=math.ceil(total / limit) if limit > 0 else 1,
    )

    return ApiResponse(
        success=True,
        data=ProjectListResponse(items=items, pagination=pagination),
    )


@router.get("/{project_id}", response_model=ApiResponse[ProjectResponse])
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = ProjectService.get_project_by_id(db, project_id)
    resp = ProjectResponse.model_validate(project)
    resp.site_count = len(project.sites) if project.sites else 0
    return ApiResponse(success=True, data=resp)


@router.put("/{project_id}", response_model=ApiResponse[ProjectResponse])
def update_project(
    project_id: int,
    req: ProjectUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    project = ProjectService.update_project(db, project_id, req)
    resp = ProjectResponse.model_validate(project)
    resp.site_count = len(project.sites) if project.sites else 0
    return ApiResponse(success=True, data=resp)


@router.delete("/{project_id}", response_model=ApiResponse[dict])
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ProjectService.delete_project(db, project_id)
    return ApiResponse(
        success=True,
        data={"message": f"Project {project_id} deleted successfully"},
    )


@router.get("/{project_id}/sites", response_model=ApiResponse[List[SiteResponse]])
def get_project_sites(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sites = ProjectService.get_project_sites(db, project_id)
    result = []
    for s in sites:
        loc = to_geojson_dict(s.location)
        result.append(
            SiteResponse(
                id=s.id,
                project_id=s.project_id,
                name=s.name,
                description=s.description,
                location=loc,
                area_hectares=s.area_hectares,
                status=s.status,
                carbon_value=s.carbon_value,
                biodiversity_value=s.biodiversity_value,
                created_at=s.created_at,
                updated_at=s.updated_at,
                project_name=s.project.name if s.project else None,
            )
        )
    return ApiResponse(success=True, data=result)
