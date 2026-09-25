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
