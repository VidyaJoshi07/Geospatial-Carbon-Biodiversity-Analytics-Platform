from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.site import Site
from app.schemas.site import (
    SiteCreate,
    SiteGeoJSONFeature,
    SiteGeoJSONFeatureCollection,
    SiteUpdate,
)
from app.services.project_service import ProjectService
from app.utils.geo import (
    calculate_polygon_area_hectares,
    to_geojson_dict,
    validate_and_normalize_geojson_polygon,
)


class SiteService:
    @staticmethod
    def create_site(db: Session, project_id: int, req: SiteCreate) -> Site:
        # Check parent project
        project = ProjectService.get_project_by_id(db, project_id)

        # Validate GeoJSON polygon
        try:
            geom_input = req.location.model_dump() if hasattr(req.location, "model_dump") else req.location
            norm_geom_dict, shape_obj = validate_and_normalize_geojson_polygon(geom_input)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid GeoJSON geometry: {str(e)}",
            )

        # Calculate area if not given or if 0
        computed_area = calculate_polygon_area_hectares(norm_geom_dict)
        area_ha = req.area_hectares if (req.area_hectares and req.area_hectares > 0) else computed_area

        site = Site(
            project_id=project.id,
            name=req.name.strip(),
            description=req.description,
            location=shape_obj,  # Handled by GeoJSONGeometry TypeDecorator
            area_hectares=area_ha,
            status=req.status or "Active",
            carbon_value=req.carbon_value or 0.0,
            biodiversity_value=req.biodiversity_value or 0.0,
        )
        db.add(site)
        db.flush()

        # Update parent project aggregates
        ProjectService.recalculate_project_aggregates(db, project_id)
        return site

    @staticmethod
    def get_site_by_id(db: Session, site_id: int) -> Site:
        site = db.query(Site).filter(Site.id == site_id).first()
        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site with ID {site_id} not found",
            )
        return site

    @staticmethod
    def list_sites(
        db: Session,
        project_id: Optional[int] = None,
        search: Optional[str] = None,
    ) -> List[Site]:
        query = db.query(Site)
        if project_id:
            query = query.filter(Site.project_id == project_id)
        if search:
            query = query.filter(Site.name.ilike(f"%{search.strip()}%"))
        return query.order_by(Site.created_at.desc()).all()

    @staticmethod
    def update_site(db: Session, site_id: int, req: SiteUpdate) -> Site:
        site = SiteService.get_site_by_id(db, site_id)
        update_data = req.model_dump(exclude_unset=True)

        if "location" in update_data and update_data["location"] is not None:
            geom_input = update_data["location"]
            try:
                norm_geom, shape_obj = validate_and_normalize_geojson_polygon(geom_input)
                site.location = shape_obj
                if not update_data.get("area_hectares"):
                    site.area_hectares = calculate_polygon_area_hectares(norm_geom)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid GeoJSON geometry: {str(e)}",
                )
            del update_data["location"]

        for key, value in update_data.items():
            if value is not None:
                setattr(site, key, value)

        db.flush()
        ProjectService.recalculate_project_aggregates(db, site.project_id)
        return site

    @staticmethod
    def delete_site(db: Session, site_id: int) -> None:
        site = SiteService.get_site_by_id(db, site_id)
        project_id = site.project_id
        db.delete(site)
        db.flush()
        ProjectService.recalculate_project_aggregates(db, project_id)

    @staticmethod
    def get_sites_geojson(db: Session, project_id: Optional[int] = None) -> SiteGeoJSONFeatureCollection:
        sites = SiteService.list_sites(db, project_id=project_id)
        features: List[SiteGeoJSONFeature] = []

        for site in sites:
            geom_dict = to_geojson_dict(site.location)
            if not geom_dict:
                continue

            properties = {
                "id": site.id,
                "project_id": site.project_id,
                "project_name": site.project.name if site.project else "",
                "project_type": site.project.project_type.value if site.project else "",
                "name": site.name,
                "description": site.description or "",
                "area_hectares": site.area_hectares,
                "status": site.status,
                "carbon_value": site.carbon_value,
                "biodiversity_value": site.biodiversity_value,
                "created_at": site.created_at.isoformat() if site.created_at else "",
            }

            feature = SiteGeoJSONFeature(
                type="Feature",
                id=site.id,
                geometry=geom_dict,
                properties=properties,
            )
            features.append(feature)

        return SiteGeoJSONFeatureCollection(
            type="FeatureCollection",
            features=features,
        )
