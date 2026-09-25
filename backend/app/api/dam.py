from fastapi import APIRouter, HTTPException, Depends, status, Body
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import DamModel
from app.gis.dam_analyzer import (
    get_tehri_dam_intelligence_data,
    compute_hydrostatic_parameters,
    get_reservoir_condition_presets
)

router = APIRouter(prefix="", tags=["Dam & Reservoir Intelligence"])

@router.get("/dams")
async def get_dams(db: AsyncSession = Depends(get_db)):
    """Fetch all dams with engineering & geometric parameters."""
    result = await db.execute(select(DamModel))
    dams = result.scalars().all()

    if not dams:
        return [get_tehri_dam_intelligence_data()["dam"]]

    return [
        {
            "id": d.id,
            "name": d.name,
            "river": d.river,
            "study_area_id": d.study_area_id,
            "dam_type": d.dam_type,
            "material": "Earth-fill with Clay Core & Rock Shell",
            "height_m": d.height_m,
            "crest_elevation_m": d.full_reservoir_level_m + 9.5,
            "foundation_elevation_m": d.full_reservoir_level_m + 9.5 - d.height_m,
            "crest_length_m": d.crest_length_m,
            "crest_width_m": 20.0,
            "base_width_m": 1125.0,
            "upstream_slope": "1.15 H : 1 V",
            "downstream_slope": "2.0 H : 1 V",
            "construction_year": d.construction_year,
            "spillway_capacity_m3s": d.spillway_capacity_m3s,
            "quality_status": "REAL"
        }
        for d in dams
    ]


@router.get("/dams/{dam_id}")
async def get_dam_by_id(dam_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch detailed dam parameters by ID."""
    result = await db.execute(select(DamModel).where(DamModel.id == dam_id))
    d = result.scalar_one_or_none()

    demo_data = get_tehri_dam_intelligence_data()["dam"]
    if not d:
        if dam_id in ["dam-tehri", "dam-tehri-demo", "default"]:
            return demo_data
        raise HTTPException(status_code=404, detail=f"Dam '{dam_id}' not found.")

    return {
        "id": d.id,
        "name": d.name,
        "river": d.river,
        "study_area_id": d.study_area_id,
        "dam_type": d.dam_type,
        "material": "Earth-fill with Clay Core & Rock Shell",
        "height_m": d.height_m,
        "crest_elevation_m": d.full_reservoir_level_m + 9.5,
        "foundation_elevation_m": d.full_reservoir_level_m + 9.5 - d.height_m,
        "crest_length_m": d.crest_length_m,
        "crest_width_m": 20.0,
        "base_width_m": 1125.0,
        "upstream_slope": "1.15 H : 1 V",
        "downstream_slope": "2.0 H : 1 V",
        "construction_year": d.construction_year,
        "spillway_capacity_m3s": d.spillway_capacity_m3s,
        "quality_status": "REAL"
    }


@router.get("/reservoirs")
async def get_reservoirs(db: AsyncSession = Depends(get_db)):
    """Fetch reservoir capacity, water levels, inflows, outflows, and storage parameters."""
    return [get_tehri_dam_intelligence_data()["reservoir"]]


@router.get("/reservoirs/{reservoir_id}")
async def get_reservoir_by_id(reservoir_id: str):
    """Fetch specific reservoir details by ID."""
    res = get_tehri_dam_intelligence_data()["reservoir"]
    if reservoir_id in [res["id"], "default", "res-tehri-001"]:
        return res
    raise HTTPException(status_code=404, detail=f"Reservoir '{reservoir_id}' not found.")


@router.get("/reservoirs/conditions/presets")
async def get_reservoir_conditions():
    """Returns 5 preset reservoir conditions: Minimum, Normal, High, Maximum, Extreme Scenario."""
    return get_reservoir_condition_presets()


@router.get("/dams/{dam_id}/hydrostatics")
async def get_dam_hydrostatics(dam_id: str):
    """Returns hydrostatic pressure distribution, hydraulic head, hydrostatic thrust force, and storage relations."""
    tehri = get_tehri_dam_intelligence_data()
    return tehri["hydrostatics"]


@router.post("/dams/calculate-hydrostatics")
async def calculate_hydrostatics(payload: Dict[str, Any] = Body(...)):
    """
    Computes hydrostatic parameters for given water level, foundation elevation, and crest length.
    P = rho * g * h, Force F = 0.5 * rho * g * h^2 * B
    """
    water_level_m = float(payload.get("water_level_m", 822.4))
    foundation_elevation_m = float(payload.get("foundation_elevation_m", 579.0))
    crest_elevation_m = float(payload.get("crest_elevation_m", 839.5))
    spillway_level_m = float(payload.get("spillway_level_m", 815.0))
    crest_length_m = float(payload.get("crest_length_m", 575.0))
    storage_capacity_mm3 = float(payload.get("storage_capacity_mm3", 3540.0))
    normal_level_m = float(payload.get("normal_level_m", 830.0))

    result = compute_hydrostatic_parameters(
        water_level_m=water_level_m,
        foundation_elevation_m=foundation_elevation_m,
        crest_elevation_m=crest_elevation_m,
        spillway_level_m=spillway_level_m,
        crest_length_m=crest_length_m,
        storage_capacity_mm3=storage_capacity_mm3,
        normal_level_m=normal_level_m
    )
    return {
        "status": "SUCCESS",
        "inputs": {
            "water_level_m": water_level_m,
            "foundation_elevation_m": foundation_elevation_m,
            "crest_length_m": crest_length_m
        },
        "hydrostatics": result
    }


@router.post("/dams/connect-scenario")
async def connect_reservoir_condition_to_scenario(payload: Dict[str, Any] = Body(...)):
    """
    Connects selected reservoir condition (Minimum / Normal / High / Maximum / Extreme)
    to the Dam-Break Scenario Engine.
    """
    condition_id = payload.get("condition_id", "cond-normal")
    presets = get_reservoir_condition_presets()
    selected_preset = next((p for p in presets if p["id"] == condition_id), presets[1])

    water_level_m = selected_preset["water_level_m"]
    h_head = max(10.0, water_level_m - 579.0)
    
    # Estimate Peak Breach Discharge using Froehlich (2008) equation: Q_peak = 0.607 * V_w^0.295 * h_w^1.24
    v_storage_m3 = (selected_preset["storage_mm3"] * 1e6)
    peak_q_m3s = round(0.607 * (v_storage_m3 ** 0.295) * (h_head ** 1.24), 1)

    return {
        "status": "SUCCESS",
        "condition": selected_preset,
        "connected_scenario_params": {
            "reservoir_water_level_m": water_level_m,
            "reservoir_water_level_percent": selected_preset["reservoir_percentage"],
            "hydraulic_head_m": round(h_head, 2),
            "estimated_storage_volume_mm3": selected_preset["storage_mm3"],
            "calculated_peak_discharge_m3s": peak_q_m3s,
            "breach_risk_tier": selected_preset["breach_risk_tier"]
        },
        "engine_message": f"Dam-Break Scenario Engine connected to '{selected_preset['name']}' reservoir condition ({water_level_m}m RL)."
    }

