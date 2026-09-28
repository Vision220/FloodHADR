"""
backend/app/api/golden_benchmark.py

REST API Router for Phase 39 Golden Tehri End-to-End Validation & Audit.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.simulation.golden_benchmark_service import GoldenBenchmarkService

router = APIRouter(prefix="/benchmark/golden", tags=["Golden Tehri Benchmark Validation"])
benchmark_service = GoldenBenchmarkService()


class GoldenBenchmarkRunRequest(BaseModel):
    scenario_params: Optional[Dict[str, Any]] = Field(None, example={"breach_width_m": 180.0, "reservoir_level_m": 830.0})
    time_step_min: int = Field(60, example=60)


class ParameterSensitivityRequest(BaseModel):
    modified_params: Optional[Dict[str, Any]] = Field(None, example={"breach_width_m": 180.0})
    time_step_min: int = Field(60, example=60)


@router.get("/baseline-parameters")
def get_baseline_parameters() -> Dict[str, Any]:
    """Returns baseline parameters for TEHRI_GOLDEN_BENCHMARK_V1."""
    return benchmark_service.get_baseline_parameters()


@router.post("/run")
def run_golden_benchmark(request: GoldenBenchmarkRunRequest) -> Dict[str, Any]:
    """
    Executes full 16-stage controlled end-to-end scientific simulation pipeline for TEHRI_GOLDEN_BENCHMARK_V1.
    Performs Stage Consistency Audit verifying scenario_id, run_id, CRS, DEM, time_reference, and duration.
    """
    try:
        return benchmark_service.execute_golden_pipeline(
            custom_params=request.scenario_params,
            time_step_min=request.time_step_min
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audit-sensitivity")
def audit_parametric_sensitivity(request: ParameterSensitivityRequest) -> Dict[str, Any]:
    """
    Executes baseline run (Breach Width = 60m) vs modified run (Breach Width = 180m).
    Audits hydrograph, flood extent, depth, velocity, 2D, 3D, HADR, AI explanation, and report responsiveness.
    Detects and flags any broken data connections.
    """
    try:
        return benchmark_service.audit_parametric_sensitivity(
            modified_params=request.modified_params,
            time_step_min=request.time_step_min
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
