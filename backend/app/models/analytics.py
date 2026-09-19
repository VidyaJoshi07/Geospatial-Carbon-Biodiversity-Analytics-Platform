from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class SiteAnalytics(Base):
    __tablename__ = "site_analytics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_date = Column(Date, nullable=False, index=True)
    carbon_value = Column(Float, nullable=False, default=0.0)
    biodiversity_value = Column(Float, nullable=False, default=0.0)
    vegetation_index = Column(Float, nullable=False, default=0.0)  # e.g., NDVI 0.0 - 1.0
    area_change = Column(Float, nullable=False, default=0.0)  # percentage or delta ha
    performance_score = Column(Float, nullable=False, default=0.0)  # 0 to 100
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    site = relationship("Site", back_populates="analytics")
