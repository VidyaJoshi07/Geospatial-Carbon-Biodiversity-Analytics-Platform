import json
from datetime import datetime, timezone

import shapely.geometry
import shapely.wkt
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKBElement, WKTElement
from geoalchemy2.shape import from_shape, to_shape
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, TypeDecorator
from sqlalchemy.orm import relationship

from app.database import Base


class GeoJSONGeometry(TypeDecorator):
    """
    Custom TypeDecorator providing PostGIS geometry storage:
    - On PostgreSQL + PostGIS: GeoAlchemy2 Geometry('POLYGON', srid=4326).
    - On isolated test SQLite: Text column for WKT / GeoJSON.
    """
    impl = Geometry(geometry_type="POLYGON", srid=4326)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect is not None and getattr(dialect, "name", None) == "postgresql":
            return dialect.type_descriptor(Geometry(geometry_type="POLYGON", srid=4326))
        elif dialect is not None:
            return dialect.type_descriptor(Text())
        return Text()

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect is not None and dialect.name == "postgresql":
            if isinstance(value, (WKBElement, WKTElement)):
                return value
            if isinstance(value, dict):
                geom = shapely.geometry.shape(value)
                return from_shape(geom, srid=4326)
            if isinstance(value, str):
                val_clean = value.strip()
                if val_clean.startswith("{"):
                    geom = shapely.geometry.shape(json.loads(val_clean))
                    return from_shape(geom, srid=4326)
                elif val_clean.upper().startswith("POLYGON"):
                    geom = shapely.wkt.loads(val_clean)
                    return from_shape(geom, srid=4326)
            if hasattr(value, "__geo_interface__"):
                return from_shape(value, srid=4326)
            return value
        else:
            # Isolated test SQLite dialect
            if isinstance(value, str):
                return value
            elif hasattr(value, "__geo_interface__"):
                return json.dumps(shapely.geometry.mapping(value))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect is not None and dialect.name == "postgresql":
            try:
                # Convert PostGIS geometry to shapely geometry
                return to_shape(value)
            except Exception:
                return value
        else:
            # Isolated test SQLite dialect
            if isinstance(value, str):
                try:
                    val_clean = value.strip()
                    if val_clean.startswith("{"):
                        return shapely.geometry.shape(json.loads(val_clean))
                    return shapely.wkt.loads(val_clean)
                except Exception:
                    return value
            return value


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    location = Column(GeoJSONGeometry, nullable=False)
    area_hectares = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), default="Active", nullable=False)
    carbon_value = Column(Float, default=0.0, nullable=False)
    biodiversity_value = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="sites")
    analytics = relationship("SiteAnalytics", back_populates="site", cascade="all, delete-orphan", lazy="selectin")
