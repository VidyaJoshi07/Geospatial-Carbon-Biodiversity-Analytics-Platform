import enum
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.database import Base


class ProjectType(str, enum.Enum):
    CARBON = "Carbon"
    BIODIVERSITY = "Biodiversity"
    MIXED = "Mixed"


class ProjectStatus(str, enum.Enum):
    ACTIVE = "Active"
    DRAFT = "Draft"
    COMPLETED = "Completed"
    ARCHIVED = "Archived"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    project_type = Column(SQLEnum(ProjectType, native_enum=False), default=ProjectType.MIXED, nullable=False, index=True)
    status = Column(SQLEnum(ProjectStatus, native_enum=False), default=ProjectStatus.ACTIVE, nullable=False, index=True)
    total_area = Column(Float, default=0.0, nullable=False)  # in Hectares
    carbon_credits = Column(Float, default=0.0, nullable=False)  # in tCO2e
    biodiversity_score = Column(Float, default=0.0, nullable=False)  # 0 to 100
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    creator = relationship("User", back_populates="projects")
    sites = relationship("Site", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
