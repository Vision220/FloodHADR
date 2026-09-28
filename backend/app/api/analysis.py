from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.entities import SimulationRunModel
from app.schemas.schemas import ImpactAnalysisResponse, HADRImpactRequest, RiskThresholdConfig
from app.gis.impact_analyzer import compute_hadr_impact
from app.simulation.ai_comparison_assistant import AIHydraulicAssistantService, ScientificAIAssistantService

router = APIRouter(prefix="/analysis", tags=["HADR Decision & AI Hydraulic Analysis"])
ai_assistant_service = AIHydraulicAssistantService()
scientific_ai_assistant_service = ScientificAIAssistantService()


class AIExplanationRequest(BaseModel):
    query_topic: str = Field("why_differ", description="why_differ | where_differ | parameter_diff | mesh_impact | observational_support | calibration_status | uncertainty_analysis")


@router.get("/simulations/{sim_id}/impact", response_model=ImpactAnalysisResponse)
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

# ----------------------------------------------------
# Phase 37: AI Hydraulic Model Comparison & Diagnostic Assistant Endpoints
# ----------------------------------------------------

class AIQueryPayload(BaseModel):
    question: str = Field("What changed between SWE and DWE?", description="User diagnostic question")


@router.get("/ai-assistant/context")
def get_ai_assistant_context() -> Dict[str, Any]:
    """
    Returns full scientific analysis context accessible by the AI Assistant.
    """
    return ai_assistant_service.get_full_context()


@router.post("/ai-assistant/explain")
def get_ai_assistant_explanation(req: AIExplanationRequest) -> Dict[str, Any]:
    """
    Processes scientific comparison query and returns objective explanation without declaring 'Model X is best'.
    """
    return ai_assistant_service.process_query(req.query_topic)


@router.post("/ai-assistant/query")
def process_ai_diagnostic_query(payload: AIQueryPayload) -> Dict[str, Any]:
    """
    Phase 37 Scientific AI Diagnostic Assistant endpoint.
    Processes user questions, calls inspection functions, cites metadata, and appends to AI Audit Log.
    """
    return scientific_ai_assistant_service.answer_question(payload.question)


@router.get("/ai-assistant/audit-log")
def get_ai_assistant_audit_log() -> Dict[str, Any]:
    """
    Returns full AI Audit Log containing question, retrieved datasets, calculations, answer, timestamp, and model version.
    """
    return {
        "audit_log_count": len(scientific_ai_assistant_service.get_audit_log()),
        "audit_log": scientific_ai_assistant_service.get_audit_log()
    }


@router.get("/ai-assistant/tools/scenario")
def tool_get_scenario(scenario_id: str = "TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO"):
    """Tool: get_scenario()"""
    return scientific_ai_assistant_service.get_scenario(scenario_id)


@router.get("/ai-assistant/tools/model-result")
def tool_get_model_result(model_name: str = "FloodHADR SWE", scenario_id: str = "TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO"):
    """Tool: get_model_result()"""
    return scientific_ai_assistant_service.get_model_result(model_name, scenario_id)


@router.get("/ai-assistant/tools/virtual-gauge")
def tool_get_virtual_gauge(gauge_id: str = "gauge-01-dam-toe"):
    """Tool: get_virtual_gauge()"""
    return scientific_ai_assistant_service.get_virtual_gauge(gauge_id)


@router.get("/ai-assistant/tools/validation-result")
def tool_get_validation_result(model_a: str = "FloodHADR SWE", model_b: str = "HEC-RAS SWE"):
    """Tool: get_validation_result()"""
    return scientific_ai_assistant_service.get_validation_result(model_a, model_b)


@router.get("/ai-assistant/tools/flood-extent-statistics")
def tool_get_flood_extent_statistics(dataset_id: str = "SENTINEL1_SAR"):
    """Tool: get_flood_extent_statistics()"""
    return scientific_ai_assistant_service.get_flood_extent_statistics(dataset_id)


@router.get("/ai-assistant/tools/asset-impacts")
def tool_get_asset_impacts(scenario_id: str = "TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO"):
    """Tool: get_asset_impacts()"""
    return scientific_ai_assistant_service.get_asset_impacts(scenario_id)


@router.get("/ai-assistant/tools/provenance")
def tool_get_provenance(item_id: str = "DEM"):
    """Tool: get_provenance()"""
    return scientific_ai_assistant_service.get_provenance(item_id)
