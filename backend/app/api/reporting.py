"""
backend/app/api/reporting.py

API Endpoints for Phase 21 — Scientific Technical Report Generation.
"""

from fastapi import APIRouter, Response, HTTPException, status
from app.simulation.scientific_report_service import ScientificReportGenerator

router = APIRouter(prefix="/reports", tags=["Scientific Technical Reporting"])

@router.get("/simulation/{sim_id}")
async def get_simulation_report_json(sim_id: str):
    """
    Generates structured JSON technical report for a specific simulation run ID.
    Includes metadata, study area, DEM, dam, breach, results, model comparison, validation, sensitivity, HADR, limitations, provenance, and reproducibility config.
    """
    generator = ScientificReportGenerator()
    report = generator.generate_full_report(run_id=sim_id)
    return report

@router.get("/simulation/{sim_id}/markdown")
async def get_simulation_report_markdown(sim_id: str):
    """
    Generates downloadable Markdown technical report (.md) for a simulation run.
    """
    generator = ScientificReportGenerator()
    report_json = generator.generate_full_report(run_id=sim_id)
    md_content = generator.render_markdown_report(report_json)
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=scientific_report_{sim_id}.md"}
    )

@router.post("/generate")
async def generate_custom_report(payload: dict):
    """
    Generates technical report for custom scenario parameters.
    Supports returning either JSON payload or rendered Markdown.
    """
    scenario_id = str(payload.get("scenario_id", "scen-custom-001"))
    run_id = str(payload.get("run_id", "sim-custom-001"))
    model_id = str(payload.get("model_id", "FloodHADR_SWE_2D"))
    model_version = str(payload.get("model_version", "v1.0.0"))
    dem_version = str(payload.get("dem_version", "ALOS_PALSAR_12M_v2"))
    hec_ras_version = payload.get("hec_ras_version", "HEC-RAS 6.4.1")
    scenario_params = payload.get("scenario_params")
    output_format = str(payload.get("format", "json")).lower()

    generator = ScientificReportGenerator()
    report_json = generator.generate_full_report(
        scenario_id=scenario_id,
        run_id=run_id,
        model_id=model_id,
        model_version=model_version,
        dem_version=dem_version,
        hec_ras_version=hec_ras_version,
        scenario_params=scenario_params
    )

    if output_format == "markdown" or output_format == "md":
        md_content = generator.render_markdown_report(report_json)
        return Response(
            content=md_content,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=scientific_report_{run_id}.md"}
        )

    return report_json
