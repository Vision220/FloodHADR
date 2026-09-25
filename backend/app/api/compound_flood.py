from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Dict, Any, Optional

from app.gis.tributary_analyzer import (
    get_tributary_network_data,
    calculate_tributary_hydraulics
)
from app.gis.compound_flood_engine import (
    get_compound_scenario_presets,
    simulate_compound_flood_scenario
)

router = APIRouter(prefix="", tags=["Tributary & Compound Flood Engine"])

@router.get("/tributaries")
async def get_tributaries():
    """Fetch all tributary networks with catchment area, stream order, confluence location, and normal/extreme discharge limits."""
    return get_tributary_network_data()


@router.get("/tributaries/{tributary_id}")
async def get_tributary_by_id(
    tributary_id: str,
    flow_regime: str = Query("EXTREME", description="NORMAL | HIGH | EXTREME | FLASH_FLOOD | COINCIDENT_PEAK"),
    rainfall_mm: float = Query(180.0),
    scs_cn: float = Query(78.0)
):
    """Fetch specific tributary hydraulics under given flow regime & rainfall."""
    tribs = get_tributary_network_data()
    t_match = next((t for t in tribs if t["id"] == tributary_id), None)
    if not t_match and tributary_id not in ["trib-bhilangna", "trib-koti-nala", "default"]:
        raise HTTPException(status_code=404, detail=f"Tributary '{tributary_id}' not found.")

    t_id = t_match["id"] if t_match else "trib-bhilangna"
    return calculate_tributary_hydraulics(
        tributary_id=t_id,
        flow_regime=flow_regime,
        rainfall_mm=rainfall_mm,
        scs_cn=scs_cn
    )


@router.get("/compound-flood/scenarios")
async def get_compound_scenarios():
    """Returns 5 compound scenario ranges: Minimum, Normal, High, Maximum, Extreme Stress Scenario."""
    return get_compound_scenario_presets()


@router.post("/compound-flood/simulate")
async def run_compound_flood_simulation(payload: Dict[str, Any] = Body(...)):
    """
    Simulates multi-hazard compound flood superposition:
    Extreme Rainfall + Tributary Flash Flood + High Main River Flow + High Reservoir Level + Dam-Break Scenario
    Computes combined downstream peak discharge, stage depth, velocity, and confluence backwater effects.
    """
    scenario_preset_id = str(payload.get("scenario_preset_id", "scen-extreme-stress"))
    include_dam_breach = payload.get("include_dam_breach", None)
    custom_rainfall_mm = payload.get("custom_rainfall_mm", None)
    tributary_regime = payload.get("tributary_regime", None)

    if custom_rainfall_mm is not None:
        custom_rainfall_mm = float(custom_rainfall_mm)

    result = simulate_compound_flood_scenario(
        scenario_preset_id=scenario_preset_id,
        include_dam_breach=include_dam_breach,
        custom_rainfall_mm=custom_rainfall_mm,
        tributary_regime=tributary_regime
    )
    return result
