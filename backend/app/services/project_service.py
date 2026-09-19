from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.project import Project, ProjectStatus
from app.models.site import Site
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectStats, ProjectUpdate


class ProjectService:
    @staticmethod
    def create_project(db: Session, req: ProjectCreate, user: User) -> Project:
        project = Project(
            name=req.name.strip(),
            description=req.description,
            project_type=req.project_type,
            status=req.status,
            total_area=req.total_area or 0.0,
            carbon_credits=req.carbon_credits or 0.0,
            biodiversity_score=req.biodiversity_score or 0.0,
            created_by=user.id,
        )
        db.add(project)
        db.flush()
        return project

    @staticmethod
    def get_project_by_id(db: Session, project_id: int) -> Project:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with ID {project_id} not found",
            )
        return project

    @staticmethod
    def list_projects(
        db: Session,
        page: int = 1,
        limit: int = 10,
        status_filter: Optional[str] = None,
        type_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Project], int]:
        query = db.query(Project)

        if status_filter:
            query = query.filter(Project.status == status_filter)
        if type_filter:
            query = query.filter(Project.project_type == type_filter)
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Project.name.ilike(search_pattern),
                    Project.description.ilike(search_pattern),
                )
            )

        total = query.count()
        offset = (page - 1) * limit
        projects = query.order_by(Project.created_at.desc()).offset(offset).limit(limit).all()

        return projects, total

    @staticmethod
    def update_project(db: Session, project_id: int, req: ProjectUpdate) -> Project:
        project = ProjectService.get_project_by_id(db, project_id)
        update_data = req.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(project, key, value)

        db.flush()
        return project

    @staticmethod
    def delete_project(db: Session, project_id: int) -> None:
        project = ProjectService.get_project_by_id(db, project_id)
        db.delete(project)
        db.flush()

    @staticmethod
    def get_dashboard_stats(db: Session) -> ProjectStats:
        total_projects = db.query(Project).count()
        active_projects = db.query(Project).filter(Project.status == ProjectStatus.ACTIVE).count()
        total_sites = db.query(Site).count()

        # Aggregated area, carbon credits, and avg biodiversity score
        area_sum = db.query(func.coalesce(func.sum(Project.total_area), 0.0)).scalar() or 0.0
        carbon_sum = db.query(func.coalesce(func.sum(Project.carbon_credits), 0.0)).scalar() or 0.0
        bio_avg = db.query(func.coalesce(func.avg(Project.biodiversity_score), 0.0)).scalar() or 0.0

        return ProjectStats(
            total_projects=total_projects,
            active_projects=active_projects,
            total_sites=total_sites,
            total_area=round(float(area_sum), 2),
            total_carbon_credits=round(float(carbon_sum), 2),
            avg_biodiversity_score=round(float(bio_avg), 2),
        )

    @staticmethod
    def get_project_sites(db: Session, project_id: int) -> List[Site]:
        # Verify project exists
        ProjectService.get_project_by_id(db, project_id)
        sites = db.query(Site).filter(Site.project_id == project_id).order_by(Site.created_at.desc()).all()
        return sites

    @staticmethod
    def recalculate_project_aggregates(db: Session, project_id: int) -> None:
        """Recalculate total_area, carbon_credits, and biodiversity_score based on its sites."""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return

        sites = db.query(Site).filter(Site.project_id == project_id).all()
        if not sites:
            return

        total_area = sum(s.area_hectares for s in sites)
        total_carbon = sum(s.carbon_value for s in sites)
        avg_bio = sum(s.biodiversity_value for s in sites) / len(sites)

        project.total_area = round(total_area, 2)
        project.carbon_credits = round(total_carbon, 2)
        project.biodiversity_score = round(avg_bio, 2)
        db.flush()
