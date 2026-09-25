from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.satellite.demo_provider import DemoSatelliteProvider
from app.satellite.gee_provider import GoogleEarthEngineProvider

router = APIRouter(prefix="/api/satellite", tags=["Satellite Monitoring"])

class SatelliteMonitoringRequest(BaseModel):
    study_area_id: str = Field(default="TEHRI_RISHIKESH", description="Target study area ID")
    satellite_source: str = Field(default="Sentinel-1 SAR", description="Satellite imagery constellation source")
    before_date: str = Field(default="2026-08-01", description="Pre-flood baseline observation date (YYYY-MM-DD)")
    after_date: str = Field(default="2026-08-15", description="Post-flood event observation date (YYYY-MM-DD)")
    provider_type: str = Field(default="DEMO", description="Provider mode: DEMO or GEE")
    simulation_id: Optional[str] = Field(default="sim_default", description="Associated hydrodynamic simulation ID for comparison")

@router.get("/sources")
async def get_satellite_sources():
    """
    Returns available Earth Observation satellite sources, study areas, and provider modes.
    """
    return {
        "sources": [
            {
                "id": "Sentinel-1 SAR",
                "name": "Sentinel-1 SAR (C-Band Radar)",
                "description": "All-weather, day/night radar imaging with cloud penetration capability.",
                "resolution": "10m",
                "revisit_days": 6,
                "recommended_for": "Cloudy monsoon flood mapping",
            },
            {
                "id": "Sentinel-2 MSI",
                "name": "Sentinel-2 MSI (Optical Multi-Spectral)",
                "description": "High resolution optical bands for MNDWI spectral index extraction.",
                "resolution": "10m",
                "revisit_days": 5,
                "recommended_for": "Clear-sky water quality & extent",
            },
            {
                "id": "Landsat 8/9 OLI",
                "name": "Landsat 8/9 OLI (Optical)",
                "description": "USGS/NASA multi-decadal observation record.",
                "resolution": "30m",
                "revisit_days": 8,
                "recommended_for": "Long-term baseline comparison",
            },
            {
                "id": "PlanetScope",
                "name": "PlanetScope (High-Res CubeSat)",
                "description": "Daily global imaging at 3m spatial resolution.",
                "resolution": "3m",
                "revisit_days": 1,
                "recommended_for": "Micro-scale localized urban flood assessment",
            },
        ],
        "study_areas": [
            {"id": "TEHRI_RISHIKESH", "name": "Tehri Hydro Complex & Rishikesh Valley", "bounds": [78.20, 30.05, 78.62, 30.42]},
            {"id": "HARIDWAR_LOWLANDS", "name": "Haridwar Ganges Floodplain", "bounds": [78.05, 29.85, 78.30, 30.05]},
            {"id": "BHAGIRATHI_UPSTREAM", "name": "Bhagirathi Basin Steep Gorge", "bounds": [78.40, 30.30, 78.80, 30.60]},
        ],
        "providers": [
            {"id": "DEMO", "name": "Demo Satellite Provider (Local Synthetic EO Data)", "is_default": True, "active": True},
            {"id": "GEE", "name": "Google Earth Engine (Live Cloud API Provider)", "is_default": False, "active": False},
        ]
    }

@router.post("/monitor")
async def run_satellite_monitoring(req: SatelliteMonitoringRequest):
    """
    Executes 5-Stage Satellite Flood Monitoring Pipeline:
    1. Acquisition (Pre & Post event imagery)
    2. Preprocessing (Speckle filtering, terrain correction)
    3. Water Detection (SAR thresholding / MNDWI spectral ratio)
    4. Flood Extent Extraction (Baseline river subtraction)
    5. Model Comparison (Satellite vs Hydrodynamic model confusion matrix & CSI)
    """
    if req.provider_type.upper() == "GEE":
        provider = GoogleEarthEngineProvider()
    else:
        provider = DemoSatelliteProvider()

    try:
        # Stage 1: Acquisition
        acquisition = provider.acquire_satellite_data(
            study_area_id=req.study_area_id,
            satellite_source=req.satellite_source,
            before_date=req.before_date,
            after_date=req.after_date
        )

        # Stage 2: Preprocessing
        preprocessing = provider.preprocess_imagery(raw_data=acquisition)

        # Stage 3: Water Detection
        water_detection = provider.detect_water_extent(preprocessed_data=preprocessing)

        # Stage 4: Flood Extent Extraction
        flood_extent = provider.extract_flood_extent(water_mask=water_detection)

        # Stage 5: Model Comparison
        comparison = provider.compare_with_model(
            satellite_extent=flood_extent,
            model_extent=None
        )

        return {
            "status": "SUCCESS",
            "study_area_id": req.study_area_id,
            "satellite_source": req.satellite_source,
            "provider_type": req.provider_type.upper(),
            "is_demo_data": True,
            "notice": (
                "DEMO DATA: Earth Observation satellite results generated for prototype decision support. "
                "Sample data is not derived from live Google Earth Engine server calls."
            ),
            "pipeline_stages": [
                {"stage": 1, "name": "Acquisition", "status": "COMPLETED", "summary": f"Acquired pre/post {req.satellite_source} coverage"},
                {"stage": 2, "name": "Preprocessing", "status": "COMPLETED", "summary": "Terrain correction (SRTM 30m) & noise filtering applied"},
                {"stage": 3, "name": "Water Detection", "status": "COMPLETED", "summary": f"Total water surface detected: {water_detection.get('total_water_area_km2')} km²"},
                {"stage": 4, "name": "Flood Extent", "status": "COMPLETED", "summary": f"Flood inundation area extracted: {flood_extent.get('flood_area_km2')} km²"},
                {"stage": 5, "name": "Model Comparison", "status": "COMPLETED", "summary": f"Spatial CSI Score: {comparison.get('metrics', {}).get('critical_success_index')}"},
            ],
            "stage_1_acquisition": acquisition,
            "stage_2_preprocessing": preprocessing,
            "stage_3_water_detection": water_detection,
            "stage_4_flood_extent": flood_extent,
            "stage_5_model_comparison": comparison,
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satellite pipeline execution failed: {str(e)}")
