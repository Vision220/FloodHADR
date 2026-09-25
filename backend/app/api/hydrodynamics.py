from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Dict, Any, Optional

from app.simulation.hydrodynamic_engine import HydrodynamicEngine

router = APIRouter(prefix="", tags=["Next-Gen Hydrodynamic Scenario Engine"])
engine_instance = HydrodynamicEngine()

@router.get("/hydrodynamics/scenarios")
async def get_hydrodynamic_scenarios():
    """Returns available scenario envelopes: MINIMUM, NORMAL, HIGH, MAXIMUM, EXTREME."""
    return [
        {
            "envelope": "MINIMUM",
            "name": "Minimum Baseline Flow",
            "description": "Ambient dry season river flow, no breach, low tributary inflow",
            "rainfall_mm": 30.0,
            "scs_cn": 65.0,
            "dam_breach": False
        },
        {
            "envelope": "NORMAL",
            "name": "Normal Monsoon Coincident Surge",
            "description": "Standard monsoon baseline + elevated tributary inflow",
            "rainfall_mm": 85.0,
            "scs_cn": 74.0,
            "dam_breach": False
        },
        {
            "envelope": "HIGH",
            "name": "High Rainfall Flood Wave",
            "description": "Heavy monsoon rainfall surge + high spillway release",
            "rainfall_mm": 140.0,
            "scs_cn": 78.0,
            "dam_breach": False
        },
        {
            "envelope": "MAXIMUM",
            "name": "Maximum Cloudburst & Partial Breach",
            "description": "Cloudburst precipitation + tributary flash flood + partial dam failure",
            "rainfall_mm": 220.0,
            "scs_cn": 82.0,
            "dam_breach": True
        },
        {
            "envelope": "EXTREME",
            "name": "Extreme PMF Breach & Multi-Tributary Coincident Peak",
            "description": "PMF Cloudburst + Catastrophic Dam Breach + Coincident Tributaries Surge",
            "rainfall_mm": 350.0,
            "scs_cn": 85.0,
            "dam_breach": True
        }
    ]


@router.post("/hydrodynamics/simulate")
async def run_hydrodynamic_simulation(payload: Dict[str, Any] = Body(...)):
    """
    Executes end-to-end hydrodynamic simulation connecting:
    SCS-CN Runoff -> Tributaries Inflow -> Basin Response -> Reservoir Dam Breach -> 2D Hydrodynamic Grid Propagation -> GIS Outputs.
    Inputs dynamically change peak discharge, depth, velocity, arrival time, and inundation area.
    """
    scenario_envelope = str(payload.get("scenario_envelope", "EXTREME"))
    dem_resolution_m = float(payload.get("dem_resolution_m", 25.0))
    grid_cols = int(payload.get("grid_cols", 40))
    grid_rows = int(payload.get("grid_rows", 40))

    custom_rainfall_mm = payload.get("custom_rainfall_mm", None)
    custom_scs_cn = payload.get("custom_scs_cn", None)
    custom_manning_n = payload.get("custom_manning_n", None)
    custom_breach_width_m = payload.get("custom_breach_width_m", None)
    custom_reservoir_level_m = payload.get("custom_reservoir_level_m", None)
    include_dam_breach = payload.get("include_dam_breach", None)

    if custom_rainfall_mm is not None:
        custom_rainfall_mm = float(custom_rainfall_mm)
    if custom_scs_cn is not None:
        custom_scs_cn = float(custom_scs_cn)
    if custom_manning_n is not None:
        custom_manning_n = float(custom_manning_n)
    if custom_breach_width_m is not None:
        custom_breach_width_m = float(custom_breach_width_m)
    if custom_reservoir_level_m is not None:
        custom_reservoir_level_m = float(custom_reservoir_level_m)

    result = engine_instance.run_simulation(
        scenario_envelope=scenario_envelope,
        dem_resolution_m=dem_resolution_m,
        grid_cols=grid_cols,
        grid_rows=grid_rows,
        custom_rainfall_mm=custom_rainfall_mm,
        custom_scs_cn=custom_scs_cn,
        custom_manning_n=custom_manning_n,
        custom_breach_width_m=custom_breach_width_m,
        custom_reservoir_level_m=custom_reservoir_level_m,
        include_dam_breach=include_dam_breach
    )
    return result
