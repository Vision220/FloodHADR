"""
backend/app/api/gis.py

REST API Endpoints for 2D Flood GIS Map Layers & SimulationFrame Streaming.
Serves manifest for all 17 mandatory 2D GIS layers, dynamic SimulationFrame GIS data,
timeline step controls (T+0 to T+360), and model selector (FloodHADR SWE, FloodHADR DWE, HEC-RAS SWE, HEC-RAS DWE).
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field

from app.gis.gis_2d_service import GIS2DLayerService
from app.gis.digital_twin_3d_service import DigitalTwin3DService
from app.gis.sync_service import Synchronized2D3DService
from app.gis.hadr_service import HADRImpactService

router = APIRouter(prefix="/gis", tags=["2D & 3D Flood GIS Engine"])
gis_service = GIS2DLayerService()
digital_twin_service = DigitalTwin3DService()
sync_service = Synchronized2D3DService()
hadr_service = HADRImpactService()


class GISFrameRequest(BaseModel):
    model_name: str = Field("FloodHADR SWE", description="Model selector: FloodHADR SWE | FloodHADR DWE | HEC-RAS SWE | HEC-RAS DWE")
    time_step_min: int = Field(30, description="Timeline offset in minutes: 0, 5, 10, 30, 45, 60, 120, 180, 240, 360")
    breach_width_m: float = Field(180.0, ge=10.0, le=500.0)
    reservoir_level_m: float = Field(830.0, ge=740.0, le=839.5)


class HADRRequest(BaseModel):
    model_name: str = Field("FloodHADR SWE", description="FloodHADR SWE | FloodHADR DWE | HEC-RAS SWE | HEC-RAS DWE")
    time_step_min: int = Field(60, description="Timeline offset in minutes")
    scenario_id: str = Field("scen-tehri-overtop")
    run_id: str = Field("sim-2026-001")
    breach_width_m: float = Field(180.0, ge=10.0, le=500.0)
    reservoir_level_m: float = Field(830.0, ge=740.0, le=839.5)


class SyncTimelineRequest(BaseModel):
    time_step_min: int = Field(45, description="Timeline step offset in minutes")


class SyncModelRequest(BaseModel):
    model_name: str = Field("FloodHADR SWE", description="FloodHADR SWE | FloodHADR DWE | HEC-RAS SWE | HEC-RAS DWE")


class SyncScenarioRequest(BaseModel):
    scenario_id: str = Field("scen-tehri-overtop")
    breach_width_m: Optional[float] = 180.0
    reservoir_level_m: Optional[float] = 830.0
    formation_time_hr: Optional[float] = 1.5


class SyncAssetSelectRequest(BaseModel):
    asset_id: str = Field(..., description="Asset identifier (e.g. bldg-emergency-01, br-tehri-suspension)")
    lat: Optional[float] = None
    lng: Optional[float] = None
    source: str = Field("2D", description="Selection source: 2D or 3D")


class SyncLocationSelectRequest(BaseModel):
    lat: float = Field(..., description="Latitude of 2D location selected")
    lng: float = Field(..., description="Longitude of 2D location selected")
    elevation_m: float = Field(650.0, description="Surface elevation in meters")


class Sync3DAssetSelectRequest(BaseModel):
    asset_id: str = Field(..., description="Asset identifier")
    world_x: Optional[float] = None
    world_y: Optional[float] = None
    world_z: Optional[float] = None


@router.get("/layers")
def get_gis_layers_manifest() -> Dict[str, Any]:
    """
    Returns the complete manifest of all 17 2D GIS layers and available timeline controls.
    """
    return gis_service.get_layer_manifest()


@router.post("/frames")
def get_gis_simulation_frame(req: GISFrameRequest) -> Dict[str, Any]:
    """
    Returns dynamic GIS layers and SimulationFrame features for a specified model configuration and timeline step.
    """
    return gis_service.get_simulation_frame_gis_data(
        model_name=req.model_name,
        time_step_min=req.time_step_min,
        scenario_params={
            "breach_width_m": req.breach_width_m,
            "reservoir_level_m": req.reservoir_level_m
        }
    )


@router.get("/3d-manifest")
def get_3d_digital_twin_manifest() -> Dict[str, Any]:
    """
    Returns manifest and compliance metadata for the Real 3D Digital Twin Engine.
    """
    return digital_twin_service.get_3d_scene_manifest()


@router.post("/3d-scene")
def get_3d_digital_twin_scene(req: GISFrameRequest) -> Dict[str, Any]:
    """
    Returns complete 3D Digital Twin scene payload strictly consuming hydraulic SimulationFrame.
    """
    return digital_twin_service.get_3d_scene_data(
        model_name=req.model_name,
        time_step_min=req.time_step_min,
        scenario_params={
            "breach_width_m": req.breach_width_m,
            "reservoir_level_m": req.reservoir_level_m
        }
    )


# ----------------------------------------------------
# Phase 40: 2D & 3D Synchronization REST Endpoints
# ----------------------------------------------------

@router.get("/sync")
def get_synchronized_state_and_views() -> Dict[str, Any]:
    """
    Returns master control state and combined synchronized 2D & 3D view payloads.
    """
    return sync_service.get_synchronized_views()


@router.post("/sync/timeline")
def update_sync_timeline(req: SyncTimelineRequest) -> Dict[str, Any]:
    """
    Updates timeline step offset (e.g. T+0, T+1h, T+2h, T+4h, T+6h) and returns synchronized 2D and 3D views.
    """
    return sync_service.set_timeline(req.time_step_min)


@router.post("/sync/model")
def update_sync_model(req: SyncModelRequest) -> Dict[str, Any]:
    """
    Switches hydraulic model selector and updates both 2D and 3D views.
    """
    return sync_service.set_model(req.model_name)


@router.post("/sync/scenario")
def update_sync_scenario(req: SyncScenarioRequest) -> Dict[str, Any]:
    """
    Updates scenario ID / parameters and synchronizes both 2D and 3D views.
    """
    params = {}
    if req.breach_width_m is not None:
        params["breach_width_m"] = req.breach_width_m
    if req.reservoir_level_m is not None:
        params["reservoir_level_m"] = req.reservoir_level_m
    if req.formation_time_hr is not None:
        params["formation_time_hr"] = req.formation_time_hr

    return sync_service.set_scenario(req.scenario_id, params)


@router.post("/sync/select-location")
def select_2d_location_endpoint(req: SyncLocationSelectRequest) -> Dict[str, Any]:
    """
    Selection in 2D map -> Updates 3D camera to focus on identical 3D world position.
    """
    return sync_service.select_2d_location(req.lat, req.lng, req.elevation_m)


@router.post("/sync/select-3d-asset")
def select_3d_asset_endpoint(req: Sync3DAssetSelectRequest) -> Dict[str, Any]:
    """
    Selection of 3D asset -> Centers 2D map on identical lat/lng and highlights 2D feature.
    """
    wpos = [req.world_x, req.world_y, req.world_z] if (req.world_x is not None and req.world_y is not None and req.world_z is not None) else None
    return sync_service.select_3d_asset(req.asset_id, wpos)


@router.post("/sync/select-asset")
def select_and_highlight_asset(req: SyncAssetSelectRequest) -> Dict[str, Any]:
    """
    Handles bidirectional asset selection (2D click -> 3D highlight, 3D click -> 2D highlight).
    """
    return sync_service.select_asset(req.asset_id, req.lat, req.lng, req.source)


@router.get("/sync/time-series-audit")
def audit_2d_3d_time_stepping() -> Dict[str, Any]:
    """
    Phase 40 Automated 2D and 3D Time Stepping Audit across T+0, T+1h, T+2h, T+4h, T+6h.
    """
    return sync_service.audit_time_series_progression([0, 60, 120, 240, 360])


# ----------------------------------------------------
# Phase 17: Infrastructure Impact & HADR REST Endpoints
# ----------------------------------------------------

@router.get("/hadr/impact")
def get_default_hadr_impact() -> Dict[str, Any]:
    """
    Returns HADR decision support metrics by consuming backend hydraulic solver outputs.
    """
    return hadr_service.evaluate_hadr_impact()


@router.post("/hadr/impact")
def evaluate_hadr_impact_endpoint(req: HADRRequest) -> Dict[str, Any]:
    """
    Evaluates HADR infrastructure impact for specified model, scenario, run, and parameters.
    """
    return hadr_service.evaluate_hadr_impact(
        model_name=req.model_name,
        time_step_min=req.time_step_min,
        scenario_id=req.scenario_id,
        run_id=req.run_id,
    )


@router.get("/visual-audit")
def audit_scientific_visuals_and_provenance() -> Dict[str, Any]:
    """
    Phase 41 Scientific Visual Audit & Transparency Verification.
    """
    from app.simulation.visual_audit_service import ScientificVisualAuditService
    audit_svc = ScientificVisualAuditService()
    return audit_svc.run_full_provenance_audit()


@router.get("/failure-tests")
def run_failure_and_edge_case_tests() -> Dict[str, Any]:
    """
    Phase 42 Automated Failure & Edge-Case Testing.
    """
    from app.simulation.failure_performance_service import FailureAndPerformanceTestingService
    return FailureAndPerformanceTestingService.test_failure_modes()


@router.get("/performance-metrics")
def measure_system_performance_metrics() -> Dict[str, Any]:
    """
    Phase 42 System Performance Measurement (Simulation time, Memory, Latency, FPS, Raster processing).
    """
    from app.simulation.failure_performance_service import FailureAndPerformanceTestingService
    return FailureAndPerformanceTestingService.measure_performance_benchmarks()


@router.get("/final-scientific-audit")
def run_final_22_subsystem_scientific_audit() -> Dict[str, Any]:
    """
    Phase 44 Final Scientific Classification Audit of 22 Core Subsystems.
    """
    from app.simulation.final_audit_service import FinalScientificAuditService
    audit_svc = FinalScientificAuditService()
    return audit_svc.run_final_audit()



