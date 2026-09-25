from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Dict, Any, Optional

from app.climate.climate_analyzer import (
    get_available_climate_providers,
    analyze_climate_risk_scenario
)

router = APIRouter(prefix="", tags=["Climate Change & Future Hazard Scenarios"])

@router.get("/climate/providers")
async def get_climate_providers():
    """Fetch registered climate projection providers and dataset connection status."""
    return get_available_climate_providers()


@router.get("/climate/horizons")
async def get_climate_horizons():
    """Returns supported scenario horizons and SSP climate emission scenarios."""
    return {
        "scenario_horizons": [
            {"id": "Current", "label": "Current Baseline (2024)", "year": 2024},
            {"id": "2030", "label": "Near-Term Projection (2030)", "year": 2030},
            {"id": "2050", "label": "Mid-Century Projection (2050)", "year": 2050},
            {"id": "2070", "label": "Late-Century Projection (2070)", "year": 2070},
            {"id": "2100", "label": "End-of-Century Projection (2100)", "year": 2100}
        ],
        "ssp_scenarios": [
            {"id": "SSP1-2.6", "name": "SSP1-2.6 (Low Emissions / Sustainability)", "temp_c": "+1.5°C"},
            {"id": "SSP2-4.5", "name": "SSP2-4.5 (Middle of the Road)", "temp_c": "+2.7°C"},
            {"id": "SSP3-7.0", "name": "SSP3-7.0 (High Regional Rivalry)", "temp_c": "+3.6°C"},
            {"id": "SSP5-8.5", "name": "SSP5-8.5 (Fossil-fueled Development)", "temp_c": "+4.4°C"}
        ]
    }


@router.post("/climate/analyze")
async def run_climate_risk_analysis(payload: Dict[str, Any] = Body(...)):
    """
    Computes Current Climate vs Future Climate Scenario comparison.
    Evaluates Rainfall, Runoff, Peak Discharge, Flood Inundation Area, Max Depth, and Max Velocity.
    Outputs mandatory dataset notice: 'Climate dataset not connected — sensitivity/demo mode.' when uncalibrated.
    """
    horizon_year = str(payload.get("horizon_year", "2050"))
    ssp_scenario = str(payload.get("ssp_scenario", "SSP3-7.0"))
    provider_id = str(payload.get("provider_id", "demo-sensitivity-climate"))
    baseline_rainfall_mm = float(payload.get("baseline_rainfall_mm", 180.0))
    scs_cn = float(payload.get("scs_cn", 78.0))

    custom_rainfall_mult = payload.get("custom_rainfall_mult", None)
    custom_runoff_mult = payload.get("custom_runoff_mult", None)
    custom_inflow_mult = payload.get("custom_inflow_mult", None)

    if custom_rainfall_mult is not None:
        custom_rainfall_mult = float(custom_rainfall_mult)
    if custom_runoff_mult is not None:
        custom_runoff_mult = float(custom_runoff_mult)
    if custom_inflow_mult is not None:
        custom_inflow_mult = float(custom_inflow_mult)

    result = analyze_climate_risk_scenario(
        horizon_year=horizon_year,
        ssp_scenario=ssp_scenario,
        provider_id=provider_id,
        baseline_rainfall_mm=baseline_rainfall_mm,
        scs_cn=scs_cn,
        custom_rainfall_mult=custom_rainfall_mult,
        custom_runoff_mult=custom_runoff_mult,
        custom_inflow_mult=custom_inflow_mult
    )
    return result
