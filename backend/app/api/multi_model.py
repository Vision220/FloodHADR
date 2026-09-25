from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Dict, Any, Optional

from app.simulation.multi_model_studio import MultiModelStudio

router = APIRouter(prefix="", tags=["AI & Multi-Model Interoperability Studio"])
studio_instance = MultiModelStudio()

@router.get("/multi-model/models")
async def get_registered_models():
    """Fetch list of all 6 registered hydraulic models, installation status, and validation notices."""
    return studio_instance.get_registered_models()


@router.post("/multi-model/compare")
async def run_model_comparison(payload: Dict[str, Any] = Body(...)):
    """
    Executes Multi-Model Comparison Studio side-by-side evaluation across:
    - 2D Diffusive Wave
    - 2D Shallow Water Equations (SWE)
    - SPH Particle Hydrodynamics
    - HEC-RAS 2D Adapter
    - Delft3D-FLOW Adapter
    - Demo ANN Surrogate (EXPERIMENTAL / NOT VALIDATED)
    Compares actual available results only.
    """
    return studio_instance.run_comparison_matrix(payload)


@router.post("/multi-model/export-deck")
async def export_external_deck(payload: Dict[str, Any] = Body(...)):
    """
    Generates import/export config decks for external HPC hydraulic models (HEC-RAS / Delft3D).
    Returns notice: 'ADAPTER IMPORT/EXPORT READY — ENGINE NOT INSTALLED LOCALLY'.
    """
    model_id = str(payload.get("model_id", "model-hec-ras"))
    peak_q = float(payload.get("peak_discharge_m3s", 12500.0))

    if model_id in ["model-hec-ras", "hec-ras"]:
        return {
            "model_id": "model-hec-ras",
            "model_name": "USACE HEC-RAS 2D Engine Adapter",
            "status": "EXPORT_READY",
            "is_installed_and_tested": False,
            "notice": "ADAPTER IMPORT/EXPORT READY — HEC-RAS ENGINE NOT INSTALLED LOCALLY",
            "export_deck": {
                "project_file": "Tehri_Basin_2D.prs",
                "geometry_file": "Tehri_Basin_2D.g01",
                "plan_file": "Tehri_Basin_2D.p01",
                "boundary_hdf5": "Tehri_Basin_2D.p01.hdf",
                "peak_discharge_m3s": peak_q
            }
        }
    elif model_id in ["model-delft3d", "delft3d"]:
        return {
            "model_id": "model-delft3d",
            "model_name": "Deltares Delft3D-FLOW Engine Adapter",
            "status": "EXPORT_READY",
            "is_installed_and_tested": False,
            "notice": "ADAPTER IMPORT/EXPORT READY — DELFT3D-FLOW ENGINE NOT INSTALLED LOCALLY",
            "export_deck": {
                "mdf_file": "tehri_delft3d.mdf",
                "bct_file": "tehri_delft3d.bct",
                "src_file": "tehri_delft3d.src",
                "dep_file": "tehri_dem.dep",
                "peak_discharge_m3s": peak_q
            }
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model_id '{model_id}' for deck export.")
