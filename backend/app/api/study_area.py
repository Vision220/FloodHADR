import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.entities import StudyAreaModel
from app.schemas.schemas import StudyAreaCreate, StudyAreaResponse

router = APIRouter(prefix="/study-areas", tags=["Study Areas"])

@router.get("", response_model=List[StudyAreaResponse])
async def get_study_areas(db: AsyncSession = Depends(get_db)):
    """Fetch all registered study area river basins."""
    result = await db.execute(select(StudyAreaModel))
    study_areas = result.scalars().all()
    return study_areas

@router.post("", response_model=StudyAreaResponse, status_code=status.HTTP_201_CREATED)
async def create_study_area(study_area_in: StudyAreaCreate, db: AsyncSession = Depends(get_db)):
    """Register a new river basin study area region."""
    unique_suffix = uuid.uuid4().hex[:6]
    new_id = f"sa-{study_area_in.name.lower().replace(' ', '-')[:15]}-{unique_suffix}"
    db_obj = StudyAreaModel(
        id=new_id,
        name=study_area_in.name,
        state=study_area_in.state,
        river=study_area_in.river,
        dam_name=study_area_in.dam_name,
        lat=study_area_in.lat,
        lng=study_area_in.lng,
        dem_resolution=study_area_in.dem_resolution,
        area_km2=study_area_in.area_km2,
        elevation_min=study_area_in.elevation_min,
        elevation_max=study_area_in.elevation_max,
        is_default=study_area_in.is_default,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj
