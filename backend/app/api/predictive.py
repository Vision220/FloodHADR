from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Dict, Any, Optional

from app.simulation.predictive_hazard_engine import PredictiveHazardEngine

router = APIRouter(prefix="", tags=["Predictive Flood Intelligence & Ensemble Scenarios"])
engine_instance = PredictiveHazardEngine()

@router.get("/predictive/scenarios")
async def get_predictive_scenarios_list():
    """Fetch definitions of Scenarios A through F and Envelope Mappings."""
    return engine_instance.get_ensemble_scenarios_definition()


@router.post("/predictive/evaluate")
async def evaluate_single_scenario(payload: Dict[str, Any] = Body(...)):
    """
    Evaluates hydraulic pipeline & uncertainty ranges for a specific scenario (SCEN_A through SCEN_F).
    Outputs: peak discharge, depth, velocity, arrival time, flood duration, affected assets, and uncertainty bounds.
    """
    scenario_id = str(payload.get("scenario_id", "SCEN_E"))
    return engine_instance.evaluate_scenario(scenario_id)


@router.get("/predictive/ensemble-matrix")
async def get_full_predictive_ensemble():
    """
    Generates complete predictive ensemble matrix across Scenarios A-F.
    Envelopes: Plausible Minimum, Typical, High, Plausible Maximum, Extreme Stress Scenario.
    Includes notice: 'Scenario envelope — probability not statistically calibrated.'
    """
    return engine_instance.generate_full_predictive_ensemble()
