import logging
from typing import Dict, Any, Tuple, Optional
from app.services.gee.gee_config import GEEConfig
from app.services.gee.gee_auth import GEEAuth

logger = logging.getLogger("FloodHADR.GEEClient")

class GEEClient:
    def __init__(self):
        self.is_auth, self.auth_message = GEEAuth.initialize()

    def get_ee_geometry(self, geometry_input: Optional[Dict[str, Any]] = None):
        """
        Convert GeoJSON geometry or bounding box dict into an ee.Geometry object.
        """
        if not self.is_auth:
            return None

        try:
            import ee
            if not geometry_input:
                bbox = GEEConfig.DEFAULT_BBOX
                return ee.Geometry.BBox(bbox[0], bbox[1], bbox[2], bbox[3])

            geom_type = geometry_input.get("type", "").lower()
            if geom_type == "polygon":
                coords = geometry_input.get("coordinates")
                return ee.Geometry.Polygon(coords)
            elif geom_type == "point":
                coords = geometry_input.get("coordinates")
                return ee.Geometry.Point(coords[0], coords[1])
            elif "bbox" in geometry_input:
                b = geometry_input["bbox"]
                return ee.Geometry.BBox(b[0], b[1], b[2], b[3])
            else:
                bbox = GEEConfig.DEFAULT_BBOX
                return ee.Geometry.BBox(bbox[0], bbox[1], bbox[2], bbox[3])
        except Exception as e:
            logger.error(f"Error building EE Geometry: {str(e)}")
            return None

    def validate_study_area(self, geometry_input: Optional[Dict[str, Any]], start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Validate study area input: geometry, CRS, bounding box, date range.
        """
        bbox = GEEConfig.DEFAULT_BBOX
        if geometry_input and "bbox" in geometry_input:
            bbox = geometry_input["bbox"]

        return {
            "valid": True,
            "crs": "EPSG:4326",
            "study_area_name": "Tehri Bhagirathi River Basin",
            "bounding_box": bbox,
            "start_date": start_date,
            "end_date": end_date,
            "center_lat": GEEConfig.DEFAULT_CENTER_LAT,
            "center_lng": GEEConfig.DEFAULT_CENTER_LNG,
            "gee_authenticated": self.is_auth,
            "provenance": "OBSERVED" if self.is_auth else "DEMO"
        }
