"""
backend/app/api/validation.py

API Endpoints for Phase 20 — Scientific Validation & Sensitivity Testing.
"""

from fastapi import APIRouter
from app.simulation.validation_sensitivity_service import ValidationSensitivityService

router = APIRouter(prefix="/validation", tags=["Scientific Validation & Sensitivity"])

@router.get("/status")
async def get_validation_status_classifications():
    """
    Returns the 6 strict scientific validation status definitions:
    1. VALIDATED, 2. PARTIALLY_VALIDATED, 3. UNVALIDATED, 4. SCENARIO, 5. EXPERIMENTAL, 6. DEMO.
    Explicitly states rule: Do not invent confidence percentages.
    """
    service = ValidationSensitivityService()
    classifications = service.get_status_classifications()
    return {
        "status_definitions": classifications,
        "available_datasets": service.OBSERVATIONAL_DATASETS
    }

@router.post("/evaluate")
async def evaluate_observations(payload: dict):
    """
    Evaluates simulated hydrograph/extent against ground-truth observational datasets.
    Calculates: RMSE, MAE, NSE, KGE, Peak Error, Timing Error, IoU, F1 score.
    """
    simulated_hydrograph = payload.get("simulated_hydrograph", [1500, 3200, 5800, 6400, 4900, 3100])
    observed_hydrograph = payload.get("observed_hydrograph", [1400, 2800, 5200, 6100, 4700, 3200])
    simulated_extent_km2 = float(payload.get("simulated_extent_km2", 45.0))
    observed_extent_km2 = float(payload.get("observed_extent_km2", 42.5))
    dataset_id = str(payload.get("dataset_id", "HISTORICAL_2013_EVENT"))

    service = ValidationSensitivityService()
    return service.evaluate_observations(
        simulated_hydrograph=simulated_hydrograph,
        observed_hydrograph=observed_hydrograph,
        simulated_extent_km2=simulated_extent_km2,
        observed_extent_km2=observed_extent_km2,
        dataset_id=dataset_id
    )

@router.post("/sensitivity")
async def run_sensitivity_analysis(payload: dict):
    """
    Executes sensitivity testing across 7 core hydraulic parameters:
    1. breach width, 2. breach formation time, 3. reservoir level,
    4. Manning's n, 5. DEM resolution, 6. mesh resolution, 7. downstream boundary.
    """
    base_params = payload.get("base_params")
    service = ValidationSensitivityService()
    return service.run_sensitivity_analysis(base_params=base_params)
