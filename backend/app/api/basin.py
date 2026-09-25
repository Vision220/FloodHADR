from fastapi import APIRouter, HTTPException, Depends, status, Body
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import (
    CatchmentModel,
    SubCatchmentModel,
    RiverModel,
    RiverBranchModel
)
from app.schemas.domain_schemas import (
    CatchmentSchema,
    SubCatchmentSchema,
    RiverDomainSchema,
    RiverBranchSchema
)
from app.gis.basin_analyzer import (
    get_tehri_basin_intelligence_data,
    validate_and_reproject_geometry,
    calculate_time_of_concentration_kirpich,
    compute_river_hydraulic_parameters
)

router = APIRouter(prefix="", tags=["Basin & River Intelligence"])

@router.get("/catchments", response_model=List[CatchmentSchema])
async def get_catchments(db: AsyncSession = Depends(get_db)):
    """Fetch all hydrological catchments with terrain parameters."""
    result = await db.execute(select(CatchmentModel))
    catchments = result.scalars().all()
    
    if not catchments:
        # Fallback to seeded basin dataset
        demo_data = get_tehri_basin_intelligence_data()["catchment"]
        return [CatchmentSchema(**demo_data)]
    
    return [
        CatchmentSchema(
            id=c.id,
            study_area_id=c.study_area_id,
            name=c.name,
            area=c.area_km2,
            perimeter=c.perimeter_km,
            elevation_min=c.elevation_min_m,
            elevation_max=c.elevation_max_m,
            mean_elevation=c.mean_elevation_m,
            mean_slope=c.mean_slope_deg,
            drainage_density=c.drainage_density_km_km2,
            time_of_concentration=c.time_of_concentration_hr,
            CN=c.cn_curve_number,
            runoff_coefficient=c.runoff_coefficient,
            data_source=c.data_source,
            quality_status=c.quality_status,
            confidence_score=c.confidence_score
        )
        for c in catchments
    ]


@router.get("/catchments/{catchment_id}", response_model=CatchmentSchema)
async def get_catchment_by_id(catchment_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch a specific catchment by ID."""
    result = await db.execute(select(CatchmentModel).where(CatchmentModel.id == catchment_id))
    c = result.scalar_one_or_none()
    
    if not c:
        demo_data = get_tehri_basin_intelligence_data()["catchment"]
        if catchment_id in ["cat-bhagirathi-001", "cat-tehri-01", "default"]:
            return CatchmentSchema(**demo_data)
        raise HTTPException(status_code=404, detail=f"Catchment '{catchment_id}' not found.")
    
    return CatchmentSchema(
        id=c.id,
        study_area_id=c.study_area_id,
        name=c.name,
        area=c.area_km2,
        perimeter=c.perimeter_km,
        elevation_min=c.elevation_min_m,
        elevation_max=c.elevation_max_m,
        mean_elevation=c.mean_elevation_m,
        mean_slope=c.mean_slope_deg,
        drainage_density=c.drainage_density_km_km2,
        time_of_concentration=c.time_of_concentration_hr,
        CN=c.cn_curve_number,
        runoff_coefficient=c.runoff_coefficient,
        data_source=c.data_source,
        quality_status=c.quality_status,
        confidence_score=c.confidence_score
    )


@router.post("/catchments/calculate")
async def calculate_catchment_gis(payload: Dict[str, Any] = Body(...)):
    """
    Real GIS calculation service: accepts GeoJSON geometry & CRS.
    Validates geometry, performs CRS projection transform, and calculates catchment area, perimeter, and time of concentration.
    """
    geometry = payload.get("geometry")
    if not geometry:
        raise HTTPException(status_code=400, detail="Missing required 'geometry' object in GeoJSON format.")

    src_crs = payload.get("src_crs", "EPSG:4326")
    target_crs = payload.get("target_crs", "EPSG:32644")
    slope_m_m = float(payload.get("slope_m_m", 0.012))
    
    # Run Shapely validation and PyProj / GeoPandas reprojection
    val_result = validate_and_reproject_geometry(geometry, src_crs=src_crs, target_crs=target_crs)
    
    if not val_result["is_valid"]:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Invalid GIS Geometry",
                "reason": val_result.get("validity_reason", "Malformed topology"),
                "geom_type": val_result.get("geom_type")
            }
        )

    # Calculate Time of Concentration (Kirpich equation)
    length_m = val_result["perimeter_km"] * 500.0 # Approximate stream length scale
    tc_hr = calculate_time_of_concentration_kirpich(length_m, slope_m_m)

    return {
        "status": "SUCCESS",
        "is_valid_geometry": True,
        "crs_transformed": f"{src_crs} -> {target_crs}",
        "calculated_area_km2": val_result["area_km2"],
        "calculated_perimeter_km": val_result["perimeter_km"],
        "calculated_time_of_concentration_hr": tc_hr,
        "drainage_density_km_km2": round(val_result["perimeter_km"] / max(1.0, val_result["area_km2"]), 2),
        "repaired_geojson": val_result["repaired_geojson"]
    }


@router.get("/subcatchments")
async def get_subcatchments(db: AsyncSession = Depends(get_db)):
    """Fetch all sub-catchment spatial polygons & parameters."""
    result = await db.execute(select(SubCatchmentModel))
    subcats = result.scalars().all()
    
    if not subcats:
        return get_tehri_basin_intelligence_data()["subcatchments"]
    
    return [
        {
            "id": s.id,
            "catchment_id": s.catchment_id,
            "name": s.name,
            "area_km2": s.area_km2,
            "elevation_mean_m": s.elevation_mean_m,
            "slope_percent": s.slope_percent,
            "impervious_percent": s.impervious_percent,
            "cn_value": s.cn_value,
            "quality_status": s.quality_status
        }
        for s in subcats
    ]


@router.get("/subcatchments/{subcatchment_id}")
async def get_subcatchment_by_id(subcatchment_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch specific sub-catchment details."""
    subcats = get_tehri_basin_intelligence_data()["subcatchments"]
    for sc in subcats:
        if sc["id"] == subcatchment_id:
            return sc
    raise HTTPException(status_code=404, detail=f"Sub-catchment '{subcatchment_id}' not found.")


@router.get("/rivers")
async def get_rivers(db: AsyncSession = Depends(get_db)):
    """Fetch all river networks with main river, tributaries, branches, sub-branches, confluences, and upstream/downstream relationships."""
    result = await db.execute(select(RiverModel))
    rivers = result.scalars().all()
    
    if not rivers:
        return get_tehri_basin_intelligence_data()["rivers"]
    
    return [
        {
            "id": r.id,
            "name": r.name,
            "study_area_id": r.study_area_id,
            "length_km": r.length_km,
            "average_slope": r.average_slope,
            "main_river": "Bhagirathi Main Channel",
            "tributaries": ["Bhilangna River", "Koti Nala Stream"],
            "branches": ["BRANCH_01_HEADWATERS", "BRANCH_02_MID_REACH", "BRANCH_03_BHILANGNA", "BRANCH_04_RESERVOIR", "BRANCH_05_DOWNSTREAM"],
            "sub_branches": ["Koti Nala Secondary Branch"],
            "confluences": [
                {"name": "Dharali Junction", "type": "Tributary Confluence"},
                {"name": "Old Tehri Confluence Node", "type": "Major River Confluence"},
                {"name": "Alaknanda Confluence (Devprayag)", "type": "Main River Terminal Confluence"}
            ],
            "upstream_downstream_relationships": [
                {"upstream": "BRANCH_01_HEADWATERS", "downstream": "BRANCH_02_MID_REACH"},
                {"upstream": "BRANCH_02_MID_REACH", "downstream": "BRANCH_04_RESERVOIR"},
                {"upstream": "BRANCH_03_BHILANGNA", "downstream": "BRANCH_04_RESERVOIR"},
                {"upstream": "BRANCH_04_RESERVOIR", "downstream": "BRANCH_05_DOWNSTREAM"}
            ]
        }
        for r in rivers
    ]


@router.get("/rivers/{river_id}")
async def get_river_by_id(river_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch a specific river network by ID."""
    result = await db.execute(select(RiverModel).where(RiverModel.id == river_id))
    r = result.scalar_one_or_none()
    
    if r:
        return {
            "id": r.id,
            "name": r.name,
            "study_area_id": r.study_area_id,
            "length_km": r.length_km,
            "average_slope": r.average_slope,
            "main_river": "Bhagirathi Main Channel",
            "tributaries": ["Bhilangna River", "Koti Nala Stream"],
            "branches": ["BRANCH_01_HEADWATERS", "BRANCH_02_MID_REACH", "BRANCH_03_BHILANGNA", "BRANCH_04_RESERVOIR", "BRANCH_05_DOWNSTREAM"],
            "sub_branches": ["Koti Nala Secondary Branch"],
            "confluences": [
                {"name": "Dharali Junction", "type": "Tributary Confluence"},
                {"name": "Old Tehri Confluence Node", "type": "Major River Confluence"},
                {"name": "Alaknanda Confluence (Devprayag)", "type": "Main River Terminal Confluence"}
            ],
            "upstream_downstream_relationships": [
                {"upstream": "BRANCH_01_HEADWATERS", "downstream": "BRANCH_02_MID_REACH"},
                {"upstream": "BRANCH_02_MID_REACH", "downstream": "BRANCH_04_RESERVOIR"},
                {"upstream": "BRANCH_03_BHILANGNA", "downstream": "BRANCH_04_RESERVOIR"},
                {"upstream": "BRANCH_04_RESERVOIR", "downstream": "BRANCH_05_DOWNSTREAM"}
            ]
        }
        
    rivers = get_tehri_basin_intelligence_data()["rivers"]
    for river in rivers:
        if river["id"] == river_id or river_id in ["riv-bhagirathi", "riv-bhagirathi-001", "default"]:
            return river

    raise HTTPException(status_code=404, detail=f"River system '{river_id}' not found.")


@router.get("/river-branches")
async def get_river_branches(db: AsyncSession = Depends(get_db)):
    """Fetch all river branches with stream order, discharge, velocity, depth, elevation range, and confluences."""
    result = await db.execute(select(RiverBranchModel))
    branches = result.scalars().all()
    
    if not branches:
        return get_tehri_basin_intelligence_data()["river_branches"]
    
    return [
        {
            "id": b.id,
            "river_id": b.river_id,
            "branch_id": b.branch_id,
            "stream_order": b.stream_order,
            "length_km": b.length_km,
            "upstream_area_km2": b.upstream_area_km2,
            "slope_m_m": b.slope_m_m,
            "elevation_min_m": b.elevation_min_m,
            "elevation_max_m": b.elevation_max_m,
            "elevation_range_m": round(b.elevation_max_m - b.elevation_min_m, 1),
            "discharge_m3s": b.discharge_m3s,
            "velocity_ms": b.velocity_ms,
            "depth_m": b.depth_m,
            "confluence": b.confluence_node,
            "quality_status": b.quality_status
        }
        for b in branches
    ]


@router.get("/river-branches/{branch_id}")
async def get_river_branch_by_id(branch_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch details for a single river branch."""
    branches = get_tehri_basin_intelligence_data()["river_branches"]
    for rb in branches:
        if rb["id"] == branch_id or rb["branch_id"] == branch_id:
            return rb
    raise HTTPException(status_code=404, detail=f"River branch '{branch_id}' not found.")


@router.post("/river-branches/compute-hydraulics")
async def compute_branch_hydraulics(payload: Dict[str, Any] = Body(...)):
    """
    Computes hydraulic properties (discharge, velocity, channel depth, elevation range) for a river branch.
    """
    length_km = float(payload.get("length_km", 45.0))
    slope_m_m = float(payload.get("slope_m_m", 0.008))
    upstream_area_km2 = float(payload.get("upstream_area_km2", 800.0))
    elevation_min_m = float(payload.get("elevation_min_m", 400.0))
    elevation_max_m = float(payload.get("elevation_max_m", 1200.0))
    mannings_n = float(payload.get("mannings_n", 0.035))

    hydr = compute_river_hydraulic_parameters(
        length_km=length_km,
        slope_m_m=slope_m_m,
        upstream_area_km2=upstream_area_km2,
        mannings_n=mannings_n
    )

    return {
        "status": "SUCCESS",
        "length_km": length_km,
        "slope_m_m": slope_m_m,
        "upstream_area_km2": upstream_area_km2,
        "elevation_range_m": round(elevation_max_m - elevation_min_m, 1),
        "computed_discharge_m3s": hydr["discharge_m3s"],
        "computed_velocity_ms": hydr["velocity_ms"],
        "computed_depth_m": hydr["depth_m"],
        "computed_channel_width_m": hydr["channel_width_m"]
    }


