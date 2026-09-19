import math
from typing import Any, Dict, Tuple

import shapely.geometry
import shapely.wkt
from geoalchemy2.elements import WKBElement, WKTElement
from geoalchemy2.shape import to_shape

EARTH_RADIUS_METERS = 6378137.0  # WGS84 mean earth radius


def calculate_spherical_polygon_area_m2(coordinates: list) -> float:
    """
    Calculate geodesic area of a spherical polygon in square meters using WGS84 ellipsoid approximation.
    Coordinates format: [[lng, lat], [lng, lat], ...] (exterior ring, closed)
    """
    if not coordinates or len(coordinates) < 4:
        return 0.0

    total = 0.0
    num_pts = len(coordinates)

    for i in range(num_pts - 1):
        p1 = coordinates[i]
        p2 = coordinates[i + 1]

        # Convert degrees to radians
        lon1 = math.radians(p1[0])
        lat1 = math.radians(p1[1])
        lon2 = math.radians(p2[0])
        lat2 = math.radians(p2[1])

        total += (lon2 - lon1) * (2.0 + math.sin(lat1) + math.sin(lat2))

    total = abs(total * (EARTH_RADIUS_METERS ** 2) / 2.0)
    return total


def calculate_polygon_area_hectares(geometry_dict_or_shape: Any) -> float:
    """
    Calculate total polygon area in hectares (1 hectare = 10,000 m²).
    Subtracts interior holes if present.
    """
    if isinstance(geometry_dict_or_shape, (shapely.geometry.Polygon, shapely.geometry.MultiPolygon)):
        geom_dict = shapely.geometry.mapping(geometry_dict_or_shape)
    elif isinstance(geometry_dict_or_shape, dict):
        geom_dict = geometry_dict_or_shape
    else:
        return 0.0

    geom_type = geom_dict.get("type")
    coords = geom_dict.get("coordinates", [])

    if geom_type == "Polygon":
        if not coords:
            return 0.0
        # Exterior ring area
        exterior_area = calculate_spherical_polygon_area_m2(coords[0])
        # Subtract interior holes
        interior_area = sum(calculate_spherical_polygon_area_m2(ring) for ring in coords[1:])
        total_m2 = max(0.0, exterior_area - interior_area)
        return round(total_m2 / 10000.0, 2)
    elif geom_type == "MultiPolygon":
        total_m2 = 0.0
        for poly_coords in coords:
            if poly_coords:
                ext = calculate_spherical_polygon_area_m2(poly_coords[0])
                holes = sum(calculate_spherical_polygon_area_m2(ring) for ring in poly_coords[1:])
                total_m2 += max(0.0, ext - holes)
        return round(total_m2 / 10000.0, 2)

    return 0.0


def validate_and_normalize_geojson_polygon(geom_input: Any) -> Tuple[Dict[str, Any], shapely.geometry.Polygon]:
    """
    Validate GeoJSON polygon or geometry dict:
    - Coordinates are within valid WGS84 ranges: lng in [-180, 180], lat in [-90, 90]
    - First and last coordinate match (closed ring)
    - Has at least 4 coordinates
    - Valid non-self-intersecting Shapely geometry
    """
    if isinstance(geom_input, dict):
        # Support Feature or Geometry
        if geom_input.get("type") == "Feature":
            geom_input = geom_input.get("geometry", {})

    geom_type = geom_input.get("type")
    if geom_type not in ["Polygon", "MultiPolygon"]:
        raise ValueError(f"Geometry must be Polygon or MultiPolygon, got: {geom_type}")

    coords = geom_input.get("coordinates")
    if not coords or not isinstance(coords, list):
        raise ValueError("Geometry coordinates must be a non-empty array")

    # Validate coordinate bounds
    rings_to_check = coords if geom_type == "Polygon" else [ring for poly in coords for ring in poly]
    for ring in rings_to_check:
        if len(ring) < 4:
            raise ValueError(f"Each linear ring must contain at least 4 coordinates, got {len(ring)}")
        if ring[0] != ring[-1]:
            # Close ring automatically if slightly unclosed
            ring.append(ring[0])
        for pt in ring:
            if not isinstance(pt, (list, tuple)) or len(pt) < 2:
                raise ValueError(f"Invalid coordinate format: {pt}")
            lng, lat = pt[0], pt[1]
            if not (-180.0 <= lng <= 180.0):
                raise ValueError(f"Longitude must be between -180 and 180, got {lng}")
            if not (-90.0 <= lat <= 90.0):
                raise ValueError(f"Latitude must be between -90 and 90, got {lat}")

    # Build shapely geometry
    try:
        shape_obj = shapely.geometry.shape(geom_input)
    except Exception as e:
        raise ValueError(f"Invalid geometry structure: {e}")

    if not shape_obj.is_valid:
        # Attempt repair
        try:
            shape_obj = shapely.make_valid(shape_obj)
        except Exception:
            raise ValueError("Polygon self-intersects or has invalid topology")

    # If the resulting geometry is a MultiPolygon with only 1 component, unpack to Polygon
    if isinstance(shape_obj, shapely.geometry.MultiPolygon) and len(shape_obj.geoms) == 1:
        shape_obj = shape_obj.geoms[0]

    normalized_dict = shapely.geometry.mapping(shape_obj)
    return normalized_dict, shape_obj


def to_geojson_dict(db_location_val: Any) -> Dict[str, Any]:
    """Convert database location field (WKBElement, Shapely, or dict) to GeoJSON dict."""
    if db_location_val is None:
        return {}
    if isinstance(db_location_val, (WKBElement, WKTElement)):
        try:
            shape = to_shape(db_location_val)
            return shapely.geometry.mapping(shape)
        except Exception:
            return {}
    if isinstance(db_location_val, (shapely.geometry.Polygon, shapely.geometry.MultiPolygon)):
        return shapely.geometry.mapping(db_location_val)
    if isinstance(db_location_val, dict):
        return db_location_val
    if isinstance(db_location_val, str):
        try:
            import json
            if db_location_val.strip().startswith("{"):
                return json.loads(db_location_val)
            shape = shapely.wkt.loads(db_location_val)
            return shapely.geometry.mapping(shape)
        except Exception:
            return {}
    return {}
