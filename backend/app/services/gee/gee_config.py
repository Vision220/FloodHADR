import os
from typing import Optional

class GEEConfig:
    PROJECT_ID: Optional[str] = os.getenv("GEE_PROJECT_ID", None)
    SERVICE_ACCOUNT: Optional[str] = os.getenv("GEE_SERVICE_ACCOUNT", None)
    PRIVATE_KEY: Optional[str] = os.getenv("GEE_PRIVATE_KEY", None)
    CREDENTIALS_FILE: Optional[str] = os.getenv("GEE_CREDENTIALS_FILE", None)

    # Earth Engine Datasets
    SENTINEL2_DATASET = "COPERNICUS/S2_SR_HARMONIZED"
    SENTINEL1_DATASET = "COPERNICUS/S1_GRD"
    CHIRPS_RAINFALL_DATASET = "UCSB-CHG/CHIRPS/DAILY"
    DYNAMIC_WORLD_LANDCOVER = "GOOGLE/DYNAMICWORLD/V1"
    COPERNICUS_LANDCOVER = "COPERNICUS/Landcover/100m/Proba-V/Global"
    JRC_WATER_DATASET = "JRC/GSW1_4/GlobalSurfaceWater"

    # Default Bounding Box for Tehri Basin demonstration [min_lng, min_lat, max_lng, max_lat]
    DEFAULT_BBOX = [78.35, 30.15, 78.95, 30.98]
    DEFAULT_CENTER_LAT = 30.3781
    DEFAULT_CENTER_LNG = 78.4802
