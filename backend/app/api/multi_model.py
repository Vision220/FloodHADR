from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Dict, Any, Optional

from app.simulation.multi_model_studio import MultiModelStudio
from app.simulation.model_comparison import HydraulicModelComparisonEngine

router = APIRouter(prefix="", tags=["AI & Multi-Model Interoperability Studio"])
studio_instance = MultiModelStudio()
comparison_engine = HydraulicModelComparisonEngine()


@router.post("/multi-model/scientific-comparison")
async def run_scientific_model_comparison(payload: Optional[Dict[str, Any]] = Body(None)):
    """
    Executes scientific comparison across:
    1. FloodHADR SWE
    2. FloodHADR DWE
    3. HEC-RAS SWE
    4. HEC-RAS DWE

    Calculates: RMSE, MAE, NSE, KGE, Peak Error, Timing Error, Area Difference, IoU, Precision, Recall, F1.
    Generates Spatial Difference Grids: Depth Difference, Velocity Difference, Arrival-Time Difference, Extent Difference.
    Reports multi-criteria scientific dimensions without arbitrary 'best model' scoring.
    """
    params = payload or {}
    return comparison_engine.compare_four_models(scenario_params=params)


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


# ----------------------------------------------------
# Phase 38: Professional Model Comparison Studio Endpoints
# ----------------------------------------------------

class PairComparisonRequest(BaseModel if 'BaseModel' in globals() else object):
    pass


@router.post("/multi-model/comparison-studio/compare-pair")
async def run_pair_model_comparison(payload: Dict[str, Any] = Body(...)):
    """
    Phase 38 Model Comparison Studio endpoint.
    Executes pairwise scientific comparison between Model A and Model B.
    Enforces common DEM, spatial domain, coordinate system, and scenario mismatch guardrail.
    Returns 8 Views: extent, depth, velocity, arrival_time, water_surface, hydrograph, difference_map, statistics.
    """
    m_a = payload.get("model_a", "FloodHADR SWE")
    m_b = payload.get("model_b", "HEC-RAS SWE")
    scen_a = payload.get("scenario_a_id", "TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO")
    scen_b = payload.get("scenario_b_id", "TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO")
    time_min = float(payload.get("time_min", 60.0))

    return comparison_engine.compare_pair(
        model_a=m_a,
        model_b=m_b,
        scenario_a_id=scen_a,
        scenario_b_id=scen_b,
        time_min=time_min
    )


@router.get("/multi-model/comparison-studio/views")
async def get_comparison_studio_views():
    """
    Returns metadata for all 8 supported views in the Model Comparison Studio.
    """
    return {
        "total_views": 8,
        "views": [
            {"id": "flood_extent", "name": "Flood Extent", "icon": "Waves", "description": "Binary inundation extent, IoU, intersection, union, delta area"},
            {"id": "depth", "name": "Water Depth", "icon": "Droplets", "description": "Maximum water depth grid comparison, RMSE, MAE"},
            {"id": "velocity", "name": "Flow Velocity", "icon": "Zap", "description": "Flow velocity vector & magnitude grid comparison, velocity RMSE, MAE"},
            {"id": "arrival_time", "name": "Arrival Time", "icon": "Clock", "description": "Flood wave arrival time contours and mean arrival delay"},
            {"id": "water_surface", "name": "Water Surface Elevation (WSE)", "icon": "Mountain", "description": "Water surface elevation grids and stage differences"},
            {"id": "hydrograph", "name": "Peak Outflow Hydrograph", "icon": "TrendingUp", "description": "Discharge time-series Q(t), peak discharge, peak timing, NSE, KGE"},
            {"id": "difference_map", "name": "Spatial Difference Map", "icon": "Map", "description": "Absolute/relative depth diffs, velocity diffs, categorical disagreement"},
            {"id": "statistics", "name": "Quantitative Statistics", "icon": "BarChart3", "description": "Comprehensive comparative evaluation matrix & non-declaration notice"}
        ]
    }
