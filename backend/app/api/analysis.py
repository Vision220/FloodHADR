from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.entities import SimulationRunModel
from app.schemas.schemas import ImpactAnalysisResponse, HADRImpactRequest, RiskThresholdConfig
from app.gis.impact_analyzer import compute_hadr_impact

router = APIRouter(prefix="/simulations", tags=["HADR Decision Analysis"])

@router.get("/{sim_id}/impact", response_model=ImpactAnalysisResponse)
async def get_simulation_hadr_impact(
    sim_id: str,
    low_max_m: Optional[float] = Query(0.5, description="Low risk upper depth threshold (m)"),
    medium_max_m: Optional[float] = Query(1.5, description="Medium risk upper depth threshold (m)"),
    high_max_m: Optional[float] = Query(3.0, description="High risk upper depth threshold (m)"),
    db: AsyncSession = Depends(get_db)
):
    """Fetch HADR spatial impact analysis using GeoPandas/Shapely spatial intersection, submerged infrastructure, and configurable risk thresholds."""
    result = await db.execute(select(SimulationRunModel).where(SimulationRunModel.id == sim_id))
    sim = result.scalar_one_or_none()
    
    max_depth = sim.max_depth_m if sim else 14.6
    max_area = sim.max_flood_area_km2 if sim else 184.2

    thresholds = {
        "low_max_m": low_max_m if low_max_m is not None else 0.5,
        "medium_max_m": medium_max_m if medium_max_m is not None else 1.5,
        "high_max_m": high_max_m if high_max_m is not None else 3.0,
    }

    impact_data = compute_hadr_impact(max_depth, max_area, thresholds)

    return ImpactAnalysisResponse(
        simulation_id=sim_id,
        submerged_hospitals_count=impact_data["submerged_hospitals_count"],
        submerged_power_grids_count=impact_data["submerged_power_grids_count"],
        affected_population=impact_data["affected_population"],
        critical_assets=impact_data["critical_assets"],
        evacuation_routes=impact_data["evacuation_routes"],
        summary_metrics=impact_data["summary_metrics"],
        risk_thresholds=impact_data["risk_thresholds"],
        risk_breakdown=impact_data["risk_breakdown"],
        is_synthetic_demo_data=impact_data["is_synthetic_demo_data"],
        demo_data_notice=impact_data["demo_data_notice"],
        affected_features=impact_data["affected_features"],
    )

@router.post("/hadr-impact", response_model=ImpactAnalysisResponse)
async def run_custom_hadr_impact(
    req: HADRImpactRequest,
    db: AsyncSession = Depends(get_db)
):
    """Run HADR spatial impact analysis with custom configurable risk thresholds."""
    sim_id = req.simulation_id or "sim-tehri-001"
    result = await db.execute(select(SimulationRunModel).where(SimulationRunModel.id == sim_id))
    sim = result.scalar_one_or_none()
    
    max_depth = sim.max_depth_m if sim else 14.6
    max_area = sim.max_flood_area_km2 if sim else 184.2

    thresholds = {}
    if req.risk_thresholds:
        thresholds = {
            "low_max_m": req.risk_thresholds.low_max_m,
            "medium_max_m": req.risk_thresholds.medium_max_m,
            "high_max_m": req.risk_thresholds.high_max_m,
        }
    else:
        thresholds = {"low_max_m": 0.5, "medium_max_m": 1.5, "high_max_m": 3.0}

    impact_data = compute_hadr_impact(max_depth, max_area, thresholds)

    return ImpactAnalysisResponse(
        simulation_id=sim_id,
        submerged_hospitals_count=impact_data["submerged_hospitals_count"],
        submerged_power_grids_count=impact_data["submerged_power_grids_count"],
        affected_population=impact_data["affected_population"],
        critical_assets=impact_data["critical_assets"],
        evacuation_routes=impact_data["evacuation_routes"],
        summary_metrics=impact_data["summary_metrics"],
        risk_thresholds=impact_data["risk_thresholds"],
        risk_breakdown=impact_data["risk_breakdown"],
        is_synthetic_demo_data=impact_data["is_synthetic_demo_data"],
        demo_data_notice=impact_data["demo_data_notice"],
        affected_features=impact_data["affected_features"],
    )
