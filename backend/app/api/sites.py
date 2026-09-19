from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.site import (
    SiteCreate,
    SiteGeoJSONFeatureCollection,
    SiteResponse,
    SiteUpdate,
)
from app.services.site_service import SiteService
from app.utils.dependencies import get_current_user, require_admin
from app.utils.geo import to_geojson_dict

router = APIRouter(tags=["Sites"])


@router.post("/projects/{project_id}/sites", response_model=ApiResponse[SiteResponse], status_code=status.HTTP_201_CREATED)
def create_site_for_project(
    project_id: int,
    req: SiteCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    site = SiteService.create_site(db, project_id, req)
    loc = to_geojson_dict(site.location)
    return ApiResponse(
        success=True,
        data=SiteResponse(
            id=site.id,
            project_id=site.project_id,
            name=site.name,
            description=site.description,
            location=loc,
            area_hectares=site.area_hectares,
            status=site.status,
            carbon_value=site.carbon_value,
            biodiversity_value=site.biodiversity_value,
            created_at=site.created_at,
            updated_at=site.updated_at,
            project_name=site.project.name if site.project else None,
        ),
    )


@router.get("/sites/geojson", response_model=ApiResponse[SiteGeoJSONFeatureCollection])
def get_sites_geojson(
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fc = SiteService.get_sites_geojson(db, project_id=project_id)
    return ApiResponse(success=True, data=fc)


@router.post("/sites/geojson", response_model=ApiResponse[SiteResponse], status_code=status.HTTP_201_CREATED)
def create_site_from_geojson(
    feature: Dict[str, Any],
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    # Extract properties and geometry from standard GeoJSON Feature
    properties = feature.get("properties", {})
    geometry = feature.get("geometry", {})
    project_id = properties.get("project_id")

    if not project_id:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GeoJSON feature properties must contain 'project_id'",
        )

    site_req = SiteCreate(
        name=properties.get("name", "New Site Area"),
        description=properties.get("description", ""),
        location=geometry,
        area_hectares=properties.get("area_hectares"),
        status=properties.get("status", "Active"),
        carbon_value=properties.get("carbon_value", 0.0),
        biodiversity_value=properties.get("biodiversity_value", 0.0),
    )

    site = SiteService.create_site(db, int(project_id), site_req)
    loc = to_geojson_dict(site.location)
    return ApiResponse(
        success=True,
        data=SiteResponse(
            id=site.id,
            project_id=site.project_id,
            name=site.name,
            description=site.description,
            location=loc,
            area_hectares=site.area_hectares,
            status=site.status,
            carbon_value=site.carbon_value,
            biodiversity_value=site.biodiversity_value,
            created_at=site.created_at,
            updated_at=site.updated_at,
            project_name=site.project.name if site.project else None,
        ),
    )


@router.get("/sites", response_model=ApiResponse[List[SiteResponse]])
def list_sites(
    project_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sites = SiteService.list_sites(db, project_id=project_id, search=search)
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


@router.get("/sites/{site_id}", response_model=ApiResponse[SiteResponse])
def get_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = SiteService.get_site_by_id(db, site_id)
    loc = to_geojson_dict(site.location)
    return ApiResponse(
        success=True,
        data=SiteResponse(
            id=site.id,
            project_id=site.project_id,
            name=site.name,
            description=site.description,
            location=loc,
            area_hectares=site.area_hectares,
            status=site.status,
            carbon_value=site.carbon_value,
            biodiversity_value=site.biodiversity_value,
            created_at=site.created_at,
            updated_at=site.updated_at,
            project_name=site.project.name if site.project else None,
        ),
    )


@router.put("/sites/{site_id}", response_model=ApiResponse[SiteResponse])
def update_site(
    site_id: int,
    req: SiteUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    site = SiteService.update_site(db, site_id, req)
    loc = to_geojson_dict(site.location)
    return ApiResponse(
        success=True,
        data=SiteResponse(
            id=site.id,
            project_id=site.project_id,
            name=site.name,
            description=site.description,
            location=loc,
            area_hectares=site.area_hectares,
            status=site.status,
            carbon_value=site.carbon_value,
            biodiversity_value=site.biodiversity_value,
            created_at=site.created_at,
            updated_at=site.updated_at,
            project_name=site.project.name if site.project else None,
        ),
    )


@router.delete("/sites/{site_id}", response_model=ApiResponse[dict])
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    SiteService.delete_site(db, site_id)
    return ApiResponse(
        success=True,
        data={"message": f"Site {site_id} deleted successfully"},
    )
