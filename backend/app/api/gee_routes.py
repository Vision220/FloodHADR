from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.services.gee_service import gee_master_service

router = APIRouter(prefix="/gee", tags=["Google Earth Engine Remote Sensing"])

class StudyAreaRequest(BaseModel):
    geometry: Optional[Dict[str, Any]] = None
    start_date: str = Field(default="2026-06-01")
    end_date: str = Field(default="2026-09-01")

class ImageryRequest(BaseModel):
    geometry: Optional[Dict[str, Any]] = None
    start_date: str = Field(default="2026-06-01")
    end_date: str = Field(default="2026-09-01")
    cloud_percentage: float = Field(default=20.0)
    preset: str = Field(default="RGB") # RGB, FalseColor, NDVI

class Sentinel1Request(BaseModel):
    geometry: Optional[Dict[str, Any]] = None
    before_start: str = Field(default="2026-05-01")
    before_end: str = Field(default="2026-05-31")
    after_start: str = Field(default="2026-07-01")
    after_end: str = Field(default="2026-07-15")
    polarization: str = Field(default="VV")

class FloodExtentRequest(BaseModel):
    geometry: Optional[Dict[str, Any]] = None
    before_date: str = Field(default="2026-05-15")
    after_date: str = Field(default="2026-07-05")
    threshold_db: float = Field(default=-14.0)

class CompareFloodRequest(BaseModel):
    simulated_area_km2: float = Field(default=28.5)
    observed_area_km2: float = Field(default=24.8)

class ChangeDetectionRequest(BaseModel):
    geometry: Optional[Dict[str, Any]] = None
    before_date: str = Field(default="2026-05-15")
    after_date: str = Field(default="2026-07-05")
    change_type: str = Field(default="FLOOD_EXTENT")

class ExportRequest(BaseModel):
    dataset: str = Field(default="Sentinel-1 SAR Flood Extent")
    export_format: str = Field(default="GeoTIFF") # GeoTIFF, GeoJSON, CSV
    description: str = Field(default="Tehri_Flood_Export")
    geometry: Optional[Dict[str, Any]] = None

@router.get("/status")
async def get_gee_status():
    """
    Check Google Earth Engine authentication and connection status.
    """
    return gee_master_service.get_status()

@router.post("/study-area")
async def validate_study_area(req: StudyAreaRequest):
    """
    Validate study area geometry and date bounds for GEE extraction.
    """
    return gee_master_service.client.validate_study_area(req.geometry, req.start_date, req.end_date)

@router.post("/imagery")
async def get_sentinel2_imagery(req: ImageryRequest):
    """
    Retrieve Sentinel-2 L2A optical satellite imagery tiles (RGB, FalseColor, NDVI).
    """
    return gee_master_service.imagery.get_sentinel2_imagery(
        geometry_input=req.geometry,
        start_date=req.start_date,
        end_date=req.end_date,
        cloud_percentage=req.cloud_percentage,
        preset=req.preset
    )

@router.post("/sentinel1")
async def get_sentinel1_sar(req: Sentinel1Request):
    """
    Retrieve Sentinel-1 SAR microwave backscatter imagery.
    """
    return gee_master_service.flood.get_sentinel1_sar(
        geometry_input=req.geometry,
        before_start=req.before_start,
        before_end=req.before_end,
        after_start=req.after_start,
        after_end=req.after_end,
        polarization=req.polarization
    )

@router.post("/rainfall")
async def get_chirps_rainfall(req: StudyAreaRequest):
    """
    Extract CHIRPS daily/cumulative satellite rainfall observation timeseries.
    """
    return gee_master_service.rainfall.get_chirps_rainfall(
        geometry_input=req.geometry,
        start_date=req.start_date,
        end_date=req.end_date
    )

@router.post("/ndvi")
async def get_ndvi_analysis(req: StudyAreaRequest):
    """
    Calculate NDVI vegetation condition index over the study area.
    """
    return gee_master_service.landcover.get_ndvi_analysis(
        geometry_input=req.geometry,
        start_date=req.start_date,
        end_date=req.end_date
    )

@router.post("/landcover")
async def get_landcover_breakdown(req: StudyAreaRequest):
    """
    Extract Land-Use / Land-Cover (LULC) area breakdown by class.
    """
    return gee_master_service.landcover.get_landcover_breakdown(geometry_input=req.geometry)

@router.post("/water")
async def get_water_monitoring(req: StudyAreaRequest):
    """
    Monitor reservoir & river water body surface area changes over time.
    """
    return gee_master_service.water.get_water_body_monitoring(
        geometry_input=req.geometry,
        start_date=req.start_date,
        end_date=req.end_date
    )

@router.post("/flood-extent")
async def get_satellite_flood_extent(req: FloodExtentRequest):
    """
    Derive satellite flood extent polygon from Sentinel-1 SAR thresholding.
    """
    return gee_master_service.flood.get_satellite_flood_extent(
        geometry_input=req.geometry,
        before_date=req.before_date,
        after_date=req.after_date,
        threshold_db=req.threshold_db
    )

@router.post("/change-detection")
async def get_change_detection(req: ChangeDetectionRequest):
    """
    Perform Before vs After event remote sensing change detection.
    """
    return gee_master_service.change_detection.get_change_detection(
        geometry_input=req.geometry,
        before_date=req.before_date,
        after_date=req.after_date,
        change_type=req.change_type
    )

@router.post("/compare-flood")
async def compare_flood_extent(req: CompareFloodRequest):
    """
    Compare GEE satellite-observed flood extent vs Hydrodynamic simulated flood extent (IoU).
    """
    return gee_master_service.flood.compare_flood_extent(
        simulated_area_km2=req.simulated_area_km2,
        observed_area_km2=req.observed_area_km2
    )

@router.post("/tile")
async def get_gee_tile(req: ImageryRequest):
    """
    Generate GEE map tile layer visualization format for Leaflet/3D canvas overlays.
    """
    return gee_master_service.imagery.get_sentinel2_imagery(
        geometry_input=req.geometry,
        start_date=req.start_date,
        end_date=req.end_date,
        preset=req.preset
    )

@router.post("/export")
async def create_export_task(req: ExportRequest):
    """
    Create an asynchronous GEE export task (GeoTIFF / GeoJSON / CSV).
    """
    return gee_master_service.exports.create_export_task(
        dataset=req.dataset,
        export_format=req.export_format,
        region=req.geometry,
        description=req.description
    )

@router.get("/tasks")
async def list_export_tasks():
    """
    List all Earth Engine export tasks and execution statuses.
    """
    return gee_master_service.exports.list_tasks()

@router.get("/task/{task_id}")
async def get_export_task(task_id: str):
    """
    Get status for a specific GEE export task.
    """
    return gee_master_service.exports.get_task_status(task_id)
