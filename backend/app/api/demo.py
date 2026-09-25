import os
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.entities import StudyAreaModel, DamModel, RiverModel, DamBreakScenarioModel, SimulationRunModel

router = APIRouter(prefix="/demo", tags=["Demo Data Package"])

DEMO_DIR = Path(__file__).parent.parent / "data" / "demo"
DEMO_NOTICE = "DEMO DATA NOTICE: All datasets in this demo package are synthetic demonstration layers generated for decision-support modeling. They MUST NEVER be represented as actual Indian ground survey observations."

@router.get("/package", summary="Inspect available demo datasets package")
async def get_demo_package_inventory():
    """
    Returns inventory of available synthetic demo datasets across all 8 subdirectories:
    dem, rivers, dams, buildings, roads, hospitals, schools, scenarios.
    """
    inventory = {
        "is_demo_package": True,
        "notice": DEMO_NOTICE,
        "package_name": "Tehri Hydroelectric Complex Synthetic HADR Demo Package",
        "categories": {}
    }
    
    categories = ["dem", "rivers", "dams", "buildings", "roads", "hospitals", "schools", "scenarios"]
    for category in categories:
        cat_dir = DEMO_DIR / category
        files = []
        if cat_dir.exists():
            for f in cat_dir.glob("*.json"):
                files.append(f.name)
        inventory["categories"][category] = {
            "path": f"data/demo/{category}/",
            "file_count": len(files),
            "files": files
        }
        
    return inventory


@router.post("/load", summary="Load complete synthetic demo scenario package")
async def load_demo_scenario(db: AsyncSession = Depends(get_db)):
    """
    Loads complete demo dataset package:
    1. Study Area (Tehri River Basin)
    2. Dam (Tehri Dam)
    3. River (Bhagirathi River)
    4. DEM (Synthetic 50m resolution elevation grid)
    5. Infrastructure (Buildings, Roads, Hospitals, Schools)
    6. Predefined Dam-Break Scenario (PMF Overtopping)
    7. Prototype Simulation Run
    8. Returns live flood results & HADR impact summary
    """
    # Load demo scenario definition from file
    scenario_file = DEMO_DIR / "scenarios" / "scenario_demo.json"
    scenario_data = {}
    if scenario_file.exists():
        with open(scenario_file, "r") as f:
            scenario_data = json.load(f)

    # 1. Study Area
    study_area_id = "sa-tehri-demo"
    study_area = await db.get(StudyAreaModel, study_area_id)
    if not study_area:
        study_area = StudyAreaModel(
            id=study_area_id,
            name="Tehri River Basin (Synthetic Demo)",
            state="Uttarakhand",
            river="Bhagirathi / Ganga River",
            dam_name="Tehri Earth & Rockfill Dam",
            lat=30.3781,
            lng=78.4802,
            dem_resolution="50m Synthetic DEM Grid",
            area_km2=1240.0,
            elevation_min=280.0,
            elevation_max=2600.0,
            is_default=True
        )
        db.add(study_area)

    # 2. Dam
    dam_id = "dam-tehri-demo"
    dam = await db.get(DamModel, dam_id)
    if not dam:
        dam = DamModel(
            id=dam_id,
            name="Tehri Dam (Synthetic Baseline)",
            river="Bhagirathi River",
            study_area_id=study_area_id,
            height_m=260.5,
            crest_length_m=575.0,
            reservoir_volume_mm3=3540.0,
            full_reservoir_level_m=830.0,
            current_water_level_m=830.0,
            dam_type="Rockfill",
            construction_year=2006,
            spillway_capacity_m3s=15540.0
        )
        db.add(dam)

    # 3. River
    river_id = "riv-bhagirathi-demo"
    river = await db.get(RiverModel, river_id)
    if not river:
        river = RiverModel(
            id=river_id,
            name="Bhagirathi River Reach (Synthetic Baseline)",
            study_area_id=study_area_id,
            length_km=65.4,
            average_slope="0.008 m/m"
        )
        db.add(river)

    # 4. Scenario
    scen_id = "scen-demo-pmf-001"
    scen = await db.get(DamBreakScenarioModel, scen_id)
    if not scen:
        scen = DamBreakScenarioModel(
            id=scen_id,
            title="Tehri PMF Overtopping & Rapid Piping Breach (Synthetic Demo)",
            dam_id=dam_id,
            failure_mode="Overtopping & Piping",
            breach_width_m=120.0,
            breach_height_m=45.0,
            formation_time_hr=1.5,
            peak_discharge_m3s=48500.0,
            reservoir_water_level_percent=100.0,
            mannings_n=0.035
        )
        db.add(scen)

    # 5. Simulation Run
    sim_id = "sim-demo-package-001"
    sim = await db.get(SimulationRunModel, sim_id)
    if not sim:
        sim = SimulationRunModel(
            id=sim_id,
            scenario_id=scen_id,
            scenario_title="Tehri PMF Overtopping & Rapid Piping Breach (Synthetic Demo)",
            dam_name="Tehri Dam (Synthetic Baseline)",
            study_area_name="Tehri River Basin (Synthetic Demo)",
            status="Completed",
            progress_percent=100,
            execution_time_sec=36.4,
            max_flood_area_km2=28.6,
            max_depth_m=14.8,
            max_velocity_ms=7.4,
            affected_population=18450,
            time_steps_total=72,
            current_time_step_sec=21600,
            peak_flow_time_hr=1.8
        )
        db.add(sim)
    else:
        # Ensure completed state
        sim.status = "Completed"
        sim.progress_percent = 100

    await db.commit()

    # Load infrastructure asset counts from files for summary
    bldg_count = 14
    road_count = 4
    hosp_count = 3
    sch_count = 3

    bldg_file = DEMO_DIR / "buildings" / "buildings_demo.json"
    if bldg_file.exists():
        with open(bldg_file, "r") as f:
            bldg_json = json.load(f)
            bldg_count = len(bldg_json.get("features", []))

    road_file = DEMO_DIR / "roads" / "roads_demo.json"
    if road_file.exists():
        with open(road_file, "r") as f:
            road_json = json.load(f)
            road_count = len(road_json.get("features", []))

    hosp_file = DEMO_DIR / "hospitals" / "hospitals_demo.json"
    if hosp_file.exists():
        with open(hosp_file, "r") as f:
            hosp_json = json.load(f)
            hosp_count = len(hosp_json.get("features", []))

    sch_file = DEMO_DIR / "schools" / "schools_demo.json"
    if sch_file.exists():
        with open(sch_file, "r") as f:
            sch_json = json.load(f)
            sch_count = len(sch_json.get("features", []))

    return {
        "status": "success",
        "message": "Synthetic demo scenario package loaded successfully into FloodHADR decision support platform.",
        "is_demo_data": True,
        "notice": DEMO_NOTICE,
        "simulation_id": sim_id,
        "scenario_id": scen_id,
        "study_area_id": study_area_id,
        "dam_id": dam_id,
        "loaded_components": {
            "study_area": "Tehri River Basin (Synthetic Demo)",
            "dam": "Tehri Dam (Height 260.5m, Rockfill)",
            "river": "Bhagirathi River Reach (65.4 km)",
            "dem_grid": "50m Synthetic DEM Grid (Elevations 280m - 2600m)",
            "scenario": "PMF Overtopping & Rapid Piping Breach",
            "infrastructure": {
                "buildings": bldg_count,
                "road_segments": road_count,
                "hospitals": hosp_count,
                "schools": sch_count
            }
        },
        "results_summary": {
            "max_flood_area_km2": 28.6,
            "max_depth_m": 14.8,
            "max_velocity_ms": 7.4,
            "first_arrival_time_min": 18.0,
            "affected_population": 18450
        }
    }
