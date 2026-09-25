import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.entities import DamModel, RiverModel
from app.schemas.schemas import DamCreate, DamResponse, RiverResponse

router = APIRouter(tags=["Data Inputs"])

@router.get("/dams", response_model=List[DamResponse])
async def get_dams(db: AsyncSession = Depends(get_db)):
    """Fetch all registered dam specifications."""
    result = await db.execute(select(DamModel))
    dams = result.scalars().all()
    return dams

@router.post("/dams", response_model=DamResponse, status_code=status.HTTP_201_CREATED)
async def create_dam(dam_in: DamCreate, db: AsyncSession = Depends(get_db)):
    """Register a new dam specification and reservoir parameters."""
    unique_suffix = uuid.uuid4().hex[:6]
    new_id = f"dam-{dam_in.name.lower().replace(' ', '-')[:15]}-{unique_suffix}"
    db_obj = DamModel(
        id=new_id,
        name=dam_in.name,
        river=dam_in.river,
        study_area_id=dam_in.study_area_id,
        height_m=dam_in.height_m,
        crest_length_m=dam_in.crest_length_m,
        reservoir_volume_mm3=dam_in.reservoir_volume_mm3,
        full_reservoir_level_m=dam_in.full_reservoir_level_m,
        current_water_level_m=dam_in.current_water_level_m,
        dam_type=dam_in.dam_type,
        construction_year=dam_in.construction_year,
        spillway_capacity_m3s=dam_in.spillway_capacity_m3s,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.get("/rivers", response_model=List[RiverResponse])
async def get_rivers(db: AsyncSession = Depends(get_db)):
    """Fetch all registered river channel reaches."""
    result = await db.execute(select(RiverModel))
    rivers = result.scalars().all()
    return rivers
