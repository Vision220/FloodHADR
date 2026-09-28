"""
backend/app/api/hecras.py

FastAPI API endpoints for HEC-RAS Reference Integration & Result Normalization.
Enforces scientific integrity:
- Never fabricates HEC-RAS results.
- Returns HEC-RAS RESULT STATUS: NOT AVAILABLE if missing.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Body
from typing import Dict, Any, Optional

from app.hec_ras.hec_ras_reference_service import HECRASReferenceService, HECRASMetadataSchema

router = APIRouter(prefix="/hecras", tags=["HEC-RAS Reference Integration"])
hecras_service = HECRASReferenceService()


@router.get("/status")
async def get_hecras_status():
    """
    Returns HEC-RAS availability status, HDF file presence, and import guidance.
    If no real result package exists, returns HEC-RAS RESULT STATUS: NOT AVAILABLE.
    """
    return hecras_service.check_hecras_availability()


@router.get("/results")
async def get_hecras_results(scenario_id: str = "scen-tehri-pmf-001"):
    """
    Fetches normalized HEC-RAS reference results normalized to FloodHADR common schema.
    If absent, explicitly returns NOT_AVAILABLE status without fabricating values.
    """
    res = hecras_service.get_hecras_normalized_result(scenario_id=scenario_id)
    if res.get("hec_ras_status") == "NOT_AVAILABLE":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "NOT_AVAILABLE",
                "hec_ras_status": "NOT_AVAILABLE",
                "status_banner": "HEC-RAS RESULT STATUS: NOT AVAILABLE",
                "message": "No HEC-RAS result package found. Upload or place native HEC-RAS .hdf or export files into data/hec_ras/results/."
            }
        )
    return res


@router.post("/import")
async def import_hecras_package(payload: Dict[str, Any] = Body(...)):
    """
    Imports a native HEC-RAS export package (.p01.hdf or GeoTIFF/GeoJSON export) into data/hec_ras/results/.
    Normalizes dataset into FloodHADR common schema.
    """
    package_name = payload.get("package_name", "tehri_dam_break_hecras.p01.hdf")
    metadata = payload.get("metadata", {})
    
    res = hecras_service.import_hecras_package(package_name=package_name, metadata=metadata)
    return {
        "status": "SUCCESS",
        "message": f"Successfully imported and normalized HEC-RAS package '{package_name}'",
        "result": res
    }
