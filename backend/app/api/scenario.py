import math
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.entities import DamBreakScenarioModel, DamModel
from app.schemas.schemas import ScenarioCreate, ScenarioResponse

router = APIRouter(prefix="/scenarios", tags=["Dam Break Scenarios"])

@router.post("", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED)
async def create_scenario(scenario_in: ScenarioCreate, db: AsyncSession = Depends(get_db)):
    """Create and parameterize a new dam break scenario."""
    # Find dam (or fallback to default dam-tehri if requested dam_id not found)
    dam_result = await db.execute(select(DamModel).where(DamModel.id == scenario_in.dam_id))
    dam = dam_result.scalar_one_or_none()
    if not dam:
        fallback_result = await db.execute(select(DamModel))
        dam = fallback_result.scalars().first()
        if not dam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No dams found in database."
            )

    # Compute Froehlich peak discharge formula: Q_p = 0.607 * V_w^0.295 * H_b^1.24
    H_b = scenario_in.breach_height_m if scenario_in.breach_height_m > 0 else dam.height_m
    V_w_m3 = dam.reservoir_volume_mm3 * 1e6
    peak_q = round(0.607 * math.pow(V_w_m3, 0.295) * math.pow(H_b, 1.24), 1)

    unique_suffix = uuid.uuid4().hex[:6]
    new_id = f"scen-{scenario_in.title.lower().replace(' ', '-')[:15]}-{unique_suffix}"
    
    db_obj = DamBreakScenarioModel(
        id=new_id,
        title=scenario_in.title,
        dam_id=dam.id,
        failure_mode=scenario_in.failure_mode,
        breach_width_m=scenario_in.breach_width_m,
        breach_height_m=H_b,
        formation_time_hr=scenario_in.formation_time_hr,
        peak_discharge_m3s=peak_q,
        reservoir_water_level_percent=scenario_in.reservoir_water_level_percent,
        mannings_n=scenario_in.mannings_n,
        form_state_json=scenario_in.form_state_json,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.get("", response_model=List[ScenarioResponse])
async def get_scenarios(db: AsyncSession = Depends(get_db)):
    """Fetch all saved dam break scenarios."""
    result = await db.execute(select(DamBreakScenarioModel))
    scenarios = result.scalars().all()
    return scenarios

@router.get("/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario_by_id(scenario_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch a specific dam break scenario by ID."""
    result = await db.execute(select(DamBreakScenarioModel).where(DamBreakScenarioModel.id == scenario_id))
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with ID '{scenario_id}' not found."
        )
    return scenario


@router.get("/breach/modes")
async def get_breach_modes():
    """
    Returns 6 supported dam breach failure modes:
    1. PARTIAL, 2. RAPID, 3. SLOW, 4. USER_DEFINED, 5. OVERTOPPING, 6. PIPING.
    """
    from app.simulation.dam_break import BREACH_MODE_DEFAULTS
    return {
        "modes": list(BREACH_MODE_DEFAULTS.values()),
        "supported_modes": ["PARTIAL", "RAPID", "SLOW", "USER_DEFINED", "OVERTOPPING", "PIPING"]
    }


@router.post("/breach/simulate")
async def run_breach_simulation(payload: dict):
    """
    Executes Phase 7 Parametric Dam Breach Engine and returns:
    breach_width_vs_time, breach_depth_vs_time, breach_discharge_hydrograph, reservoir_drawdown, released_volume.
    Every parameter carries provenance: 'SCENARIO'.
    """
    from app.simulation.dam_break import run_authoritative_dam_break_simulation

    mode = str(payload.get("mode", "OVERTOPPING"))
    breach_width_m = float(payload.get("breach_width_m", 180.0))
    breach_formation_time_hr = float(payload.get("breach_formation_time_hr", 1.5))
    reservoir_level_m = float(payload.get("reservoir_level_m", 830.0))
    side_slopes = float(payload.get("side_slopes", 0.7))
    discharge_coefficient = float(payload.get("discharge_coefficient", 1.70))
    simulation_duration_hr = float(payload.get("simulation_duration_hr", 12.0))

    res = run_authoritative_dam_break_simulation(
        mode=mode,
        breach_width_m=breach_width_m,
        breach_formation_time_hr=breach_formation_time_hr,
        reservoir_level_m=reservoir_level_m,
        side_slopes=side_slopes,
        discharge_coefficient=discharge_coefficient,
        simulation_duration_hr=simulation_duration_hr
    )
    return res


@router.get("/lab/presets")
async def get_scenario_lab_presets():
    """
    Returns 10 preconfigured scenario lab presets:
    BASELINE, MDDL, MID_STORAGE, FRL, EXTREME_INFLOW, PMF, PARTIAL_BREACH, RAPID_BREACH, SLOW_BREACH, USER_DEFINED.
    """
    from app.simulation.scenario_lab_service import ScenarioLabService
    lab = ScenarioLabService()
    return lab.get_presets()


@router.post("/lab/duplicate")
async def duplicate_scenario_lab(payload: dict):
    """
    Duplicates a base scenario preset and applies custom modifications across 13 parameters.
    """
    from app.simulation.scenario_lab_service import ScenarioLabService
    base_preset_id = payload.get("base_preset_id", "BASELINE")
    modifications = payload.get("modifications", {})
    lab = ScenarioLabService()
    return lab.duplicate_and_modify(base_preset_id=base_preset_id, modifications=modifications)


@router.post("/lab/compare")
async def compare_scenarios_side_by_side(payload: dict):
    """
    Executes side-by-side scenario comparison and returns 6 quantitative difference metrics:
    1. depth difference (Delta h)
    2. velocity difference (Delta v)
    3. arrival-time difference (Delta t_arr)
    4. inundation-area difference (Delta A)
    5. affected population difference (Delta Pop)
    6. infrastructure difference (Delta Infra)
    """
    from app.simulation.scenario_lab_service import ScenarioLabService
    scenario_a = payload.get("scenario_a", {})
    scenario_b = payload.get("scenario_b", {})
    time_step_min = payload.get("time_step_min", 60)
    lab = ScenarioLabService()
    return lab.compare_side_by_side(
        scenario_a_params=scenario_a,
        scenario_b_params=scenario_b,
        time_step_min=time_step_min
    )


@router.get("/tehri/catalog")
async def get_tehri_scenario_catalog():
    """
    Returns Phase 35 Tehri Flood & Dam-Break Scenario Catalog.
    Separates PMF routing without failure, Overtopping failure, FRL breach, MDDL breach, Spillway operation, Extreme inflow, and User-defined.
    Enforces PMF != dam break rule.
    """
    from app.simulation.tehri_scenario_service import TehriScenarioService
    service = TehriScenarioService()
    return service.get_all_scenarios()


@router.get("/tehri/{scenario_id}")
async def get_tehri_scenario_by_id(scenario_id: str):
    """
    Retrieves specific Tehri scenario metadata with all 12 explicit parameters and assumptions metadata.
    """
    from app.simulation.tehri_scenario_service import TehriScenarioService
    service = TehriScenarioService()
    return service.get_scenario(scenario_id)


@router.post("/tehri/evaluate")
async def evaluate_tehri_scenario(payload: dict):
    """
    Evaluates hydraulic routing and peak discharge for a specific Tehri scenario.
    Enforces breach_occurrence rule (PMF without failure does NOT generate breach flow).
    """
    from app.simulation.tehri_scenario_service import TehriScenarioService
    scenario_id = payload.get("scenario_id", "TEHRI_PMF_NO_FAILURE")
    service = TehriScenarioService()
    return service.evaluate_scenario_hydrodynamics(scenario_id)



