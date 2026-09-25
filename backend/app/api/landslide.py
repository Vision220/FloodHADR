from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Dict, Any, Optional

from app.gis.landslide_analyzer import (
    get_known_landslide_inventory,
    calculate_landslide_susceptibility
)
from app.gis.landslide_blockage_engine import (
    simulate_landslide_river_blockage
)

router = APIRouter(prefix="", tags=["Landslide & River Blockage Module"])

@router.get("/landslides/inventory")
async def get_landslide_inventory():
    """Fetch known monitored landslide hazard inventory points in the study area."""
    return get_known_landslide_inventory()


@router.post("/landslides/susceptibility")
async def compute_susceptibility(payload: Dict[str, Any] = Body(...)):
    """
    Computes Landslide Susceptibility Index (LSI) from slope, elevation, trigger rainfall, soil, geology, and land cover.
    Includes explicit notice: 'SIMPLIFIED GEOTECHNICAL SCENARIO — NOT GEOLOGICAL PREDICTION'.
    """
    slope_deg = float(payload.get("slope_deg", 38.0))
    elevation_m = float(payload.get("elevation_m", 1450.0))
    trigger_rainfall_mm = float(payload.get("trigger_rainfall_mm", 180.0))
    soil_type = str(payload.get("soil_type", "COLLUVIAL"))
    geology_type = str(payload.get("geology_type", "PHYLLITE_SCHIST"))
    land_cover = str(payload.get("land_cover", "BARREN_DEGRADED"))

    return calculate_landslide_susceptibility(
        slope_deg=slope_deg,
        elevation_m=elevation_m,
        trigger_rainfall_mm=trigger_rainfall_mm,
        soil_type=soil_type,
        geology_type=geology_type,
        land_cover=land_cover
    )


@router.post("/landslides/blockage-simulate")
async def run_river_blockage_simulation(payload: Dict[str, Any] = Body(...)):
    """
    Simulates cascading landslide-induced river blockage dynamics:
    Landslide -> River Blockage -> Upstream Water Level Increase (Ponding) -> Temporary Storage -> Blockage Failure -> Sudden Downstream Flood Wave
    Scenarios: NONE | PARTIAL_BLOCKAGE | MAJOR_BLOCKAGE
    """
    blockage_scenario = str(payload.get("blockage_scenario", "MAJOR_BLOCKAGE"))
    landslide_id = str(payload.get("landslide_id", "ls-koti-nala"))
    river_inflow_m3s = float(payload.get("river_inflow_m3s", 1250.0))
    trigger_rainfall_mm = float(payload.get("trigger_rainfall_mm", 180.0))
    custom_slide_volume_m3 = payload.get("custom_slide_volume_m3", None)

    if custom_slide_volume_m3 is not None:
        custom_slide_volume_m3 = float(custom_slide_volume_m3)

    return simulate_landslide_river_blockage(
        blockage_scenario=blockage_scenario,
        landslide_id=landslide_id,
        river_inflow_m3s=river_inflow_m3s,
        trigger_rainfall_mm=trigger_rainfall_mm,
        custom_slide_volume_m3=custom_slide_volume_m3
    )
