from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


class GeoJSONGeometryInput(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]  # Polygon rings: [[[lng, lat], ...]]


class SiteCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    location: Union[GeoJSONGeometryInput, Dict[str, Any]]
    area_hectares: Optional[float] = None  # If not provided, computed from polygon
    status: str = "Active"
    carbon_value: Optional[float] = 0.0
    biodiversity_value: Optional[float] = 0.0


class SiteUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    location: Optional[Union[GeoJSONGeometryInput, Dict[str, Any]]] = None
    area_hectares: Optional[float] = None
    status: Optional[str] = None
    carbon_value: Optional[float] = None
    biodiversity_value: Optional[float] = None


class SiteResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str] = None
    location: Dict[str, Any]  # Serialized GeoJSON geometry dict
    area_hectares: float
    status: str
    carbon_value: float
    biodiversity_value: float
    created_at: datetime
    updated_at: datetime
    project_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SiteGeoJSONProperties(BaseModel):
    id: int
    project_id: int
    project_name: Optional[str] = ""
    project_type: Optional[str] = ""
    name: str
    description: Optional[str] = ""
    area_hectares: float
    status: str
    carbon_value: float
    biodiversity_value: float
    created_at: str


class SiteGeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: int
    geometry: Dict[str, Any]
    properties: Dict[str, Any]


class SiteGeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[SiteGeoJSONFeature]
