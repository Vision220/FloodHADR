import os
import uuid
import shutil
from typing import Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.gis.dem_processor import DEMProcessor, DEMValidationError
from app.schemas.schemas import DEMMetadataResponse, DEMPreviewResponse
from app.utils.synthetic_dem import generate_synthetic_dem

router = APIRouter(tags=["DEM Processing"])

# In-memory storage for processed DEM records (in addition to file persistence)
DEM_STORE: Dict[str, Dict[str, Any]] = {}
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "dem")

def ensure_default_synthetic_dem():
    """Generates and processes default synthetic DEM if DEM store is empty."""
    default_id = "dem-tehri-default"
    if default_id not in DEM_STORE:
        synth_path = os.path.join(UPLOAD_DIR, "synthetic_tehri_dem.tif")
        if not os.path.exists(synth_path):
            generate_synthetic_dem(synth_path)
        
        try:
            processed = DEMProcessor.process_dem(synth_path, "synthetic_tehri_dem.tif")
            DEM_STORE[default_id] = {
                "id": default_id,
                "metadata": {**processed["metadata"], "id": default_id},
                "preview": {**processed["preview"], "id": default_id},
                "simulation_grid": processed["simulation_grid"]
            }
        except Exception as e:
            print(f"Error initializing synthetic DEM: {e}")

@router.post("/upload", response_model=DEMMetadataResponse, status_code=status.HTTP_201_CREATED)
async def upload_dem(file: UploadFile = File(...)):
    """
    Upload a DEM raster file (GeoTIFF, .tif, .tiff).
    Validates raster integrity, reads CRS & elevation values, computes terrain stats,
    generates simulation grid, and stores non-destructively.
    """
    if not file.filename.lower().endswith(('.tif', '.tiff', '.geotiff')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only GeoTIFF raster files (.tif, .tiff, .geotiff) are supported."
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    dem_id = f"dem-{uuid.uuid4().hex[:8]}"
    saved_filename = f"{dem_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)

    # Save file to disk non-destructively
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded DEM file: {str(e)}"
        )
    finally:
        await file.close()

    # Validate and process raster
    try:
        processed = DEMProcessor.process_dem(file_path, file.filename)
    except DEMValidationError as ve:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DEM Raster Validation Failed: {str(ve)}"
        )
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error processing DEM raster data: {str(e)}"
        )

    dem_metadata = {**processed["metadata"], "id": dem_id}
    dem_preview = {**processed["preview"], "id": dem_id}

    DEM_STORE[dem_id] = {
        "id": dem_id,
        "metadata": dem_metadata,
        "preview": dem_preview,
        "simulation_grid": processed["simulation_grid"],
    }

    return dem_metadata

@router.get("/{id}/metadata", response_model=DEMMetadataResponse)
async def get_dem_metadata(id: str):
    """
    Fetch extracted DEM metadata, spatial resolution, CRS, and elevation statistics.
    """
    ensure_default_synthetic_dem()
    if id not in DEM_STORE:
        # Fallback to default if requested default or first available
        if id == "default" or id == "dem-tehri-default":
            return DEM_STORE["dem-tehri-default"]["metadata"]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DEM dataset with ID '{id}' not found."
        )
    return DEM_STORE[id]["metadata"]

@router.get("/{id}/preview", response_model=DEMPreviewResponse)
async def get_dem_preview(id: str):
    """
    Fetch downsampled 2D elevation grid matrix and GeoJSON coverage boundary for map overlay.
    """
    ensure_default_synthetic_dem()
    if id not in DEM_STORE:
        if id == "default" or id == "dem-tehri-default":
            return DEM_STORE["dem-tehri-default"]["preview"]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DEM preview for dataset ID '{id}' not found."
        )
    return DEM_STORE[id]["preview"]
