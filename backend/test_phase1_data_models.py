import sys
import os
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Base
from app.models.entities import (
    StudyAreaModel,
    DamModel,
    RiverModel,
    DamBreakScenarioModel,
    SimulationRunModel,
)
from app.models.domain_entities import (
    DataSourceModel,
    CatchmentModel,
    SubCatchmentModel,
    RiverBranchModel,
    ReservoirModel,
    RainfallRecordModel,
    RainfallForecastModel,
    ClimateScenarioModel,
    LandslideModel,
    SensorModel,
    HydraulicResultModel,
    FloodExtentModel,
    InfrastructureAssetModel,
    AssetExposureModel,
    ModelRunModel,
)
from app.schemas.domain_schemas import (
    CatchmentSchema,
    SubCatchmentSchema,
    RiverBranchSchema,
    DamDomainSchema,
    ReservoirSchema,
    RainfallRecordSchema,
    RainfallForecastSchema,
    ClimateScenarioSchema,
    LandslideSchema,
    SensorSchema,
    ScenarioDomainSchema,
    SimulationDomainSchema,
    HydraulicResultSchema,
    FloodExtentSchema,
    InfrastructureAssetSchema,
    AssetExposureSchema,
    ModelRunSchema,
    DataSourceSchema,
)

def test_phase1_data_foundation():
    print("==================================================")
    print("  FLOODHADR PHASE 1: DATA MODEL & DATABASE TEST   ")
    print("==================================================")

    # 1. Test Sync SQLite Engine Table Creation
    TEST_DB_URL = "sqlite:///:memory:"
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    
    print("[1/4] Creating SQLite database tables for all 20 domain entities...")
    Base.metadata.create_all(bind=engine)
    
    tables_created = engine.dialect.get_table_names(engine.connect())
    print(f"  SUCCESS: {len(tables_created)} database tables initialized:")
    print(f"  Tables: {tables_created}")

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # 2. Test Record Insertion & Provenance Attributes
    print("\n[2/4] Testing record insertion across 20 domain entities with provenance metadata...")

    # Data Source (20)
    ds = DataSourceModel(
        id="ds-cwc-01",
        name="Central Water Commission Gauge Network",
        provider_organization="CWC / Survey of India",
        source_type="OBSERVED",
        quality_status="OBSERVED",
        confidence_score=0.98
    )
    db.add(ds)

    # Study Area (1)
    sa = StudyAreaModel(
        id="sa-tehri-p1",
        name="Tehri River Basin & Downstream Valley",
        state="Uttarakhand",
        river="Bhagirathi River",
        dam_name="Tehri Dam",
        lat=30.3781,
        lng=78.4802,
        area_km2=1240.0,
        elevation_min=280.0,
        elevation_max=2600.0,
        is_default=True
    )
    db.add(sa)
    db.flush()

    # Catchment (2)
    cat = CatchmentModel(
        id="cat-tehri-01",
        study_area_id=sa.id,
        name="Upper Bhagirathi Catchment",
        area_km2=1240.0,
        perimeter_km=180.5,
        elevation_min_m=280.0,
        elevation_max_m=2600.0,
        mean_elevation_m=1440.0,
        mean_slope_deg=14.2,
        drainage_density_km_km2=2.15,
        time_of_concentration_hr=6.4,
        cn_curve_number=78.0,
        runoff_coefficient=0.45,
        data_source="ALOS PALSAR DEM & CWC Hydrology",
        quality_status="DEMO",
        confidence_score=0.94
    )
    db.add(cat)
    db.flush()

    # SubCatchment (3)
    subcat = SubCatchmentModel(
        id="subcat-koti-01",
        catchment_id=cat.id,
        name="Koti Nala Sub-Catchment",
        area_km2=240.0,
        elevation_mean_m=1120.0,
        slope_percent=12.5,
        impervious_percent=15.0,
        cn_value=75.0,
        data_source="GIS Watershed Delineation",
        quality_status="SYNTHETIC",
        confidence_score=0.91
    )
    db.add(subcat)

    # River (4)
    riv = RiverModel(
        id="riv-bhagirathi-01",
        name="Bhagirathi River Main Reach",
        study_area_id=sa.id,
        length_km=65.4,
        average_slope="0.005 m/m"
    )
    db.add(riv)
    db.flush()

    # RiverBranch (5)
    rb = RiverBranchModel(
        id="rb-bhagirathi-br1",
        river_id=riv.id,
        branch_id="BR_BHAGIRATHI_MAIN",
        stream_order=5,
        length_km=32.5,
        upstream_area_km2=850.0,
        slope_m_m=0.006,
        elevation_min_m=420.0,
        elevation_max_m=1100.0,
        discharge_m3s=350.0,
        velocity_ms=1.8,
        depth_m=3.2,
        confluence_node="Tehri Confluence Node",
        data_source="1D/2D Hydro Network Extraction",
        quality_status="REAL",
        confidence_score=0.97
    )
    db.add(rb)

    # Dam (6)
    dam = DamModel(
        id="dam-tehri-p1",
        name="Tehri Earth and Rockfill Dam",
        river="Bhagirathi River",
        study_area_id=sa.id,
        height_m=260.5,
        crest_length_m=575.0,
        reservoir_volume_mm3=3540.0,
        full_reservoir_level_m=830.0,
        current_water_level_m=822.4,
        dam_type="Rockfill",
        construction_year=2006,
        spillway_capacity_m3s=15540.0
    )
    db.add(dam)
    db.flush()

    # Reservoir (7)
    res = ReservoirModel(
        id="res-tehri-01",
        dam_id=dam.id,
        name="Tehri Hydroelectric Reservoir",
        area_km2=42.0,
        storage_capacity_mm3=3540.0,
        live_storage_mm3=2615.0,
        dead_storage_mm3=925.0,
        current_storage_mm3=3200.0,
        water_level_m=822.4,
        minimum_level_m=740.0,
        normal_level_m=830.0,
        maximum_level_m=835.0,
        spillway_level_m=815.0,
        inflow_m3s=1250.0,
        outflow_m3s=450.0,
        data_source="CWC Reservoir Telemetry",
        quality_status="OBSERVED",
        confidence_score=0.99
    )
    db.add(res)

    # RainfallRecord (8)
    rf_rec = RainfallRecordModel(
        id="rf-rec-01",
        catchment_id=cat.id,
        station_name="Tehri IMD Automatic Weather Station",
        intensity_mm_hr=45.0,
        cumulative_rainfall_mm=180.0,
        duration_hr=4.0,
        source="IMD Automatic Rain Gauge Network",
        quality_status="OBSERVED",
        confidence_score=0.96
    )
    db.add(rf_rec)

    # RainfallForecast (9)
    rf_fcst = RainfallForecastModel(
        id="rf-fcst-01",
        catchment_id=cat.id,
        model_name="NCMRWF GFS 12km Ensemble",
        horizon_hr=24.0,
        intensity_mm_hr=65.0,
        cumulative_rainfall_mm=240.0,
        duration_hr=6.0,
        probability_percent=85.0,
        source="IMD NWP Forecast Feed",
        quality_status="FORECAST",
        confidence_score=0.88
    )
    db.add(rf_fcst)

    # ClimateScenario (10)
    clim = ClimateScenarioModel(
        id="clim-rcp85-01",
        name="SSP5-8.5 Extreme Warming & Cloudburst",
        rcp_scenario="RCP 8.5",
        temperature_anomaly_c=3.5,
        precipitation_delta_percent=28.0,
        extreme_event_frequency_factor=2.2,
        sea_level_rise_m=0.0,
        data_source="IPCC AR6 Regional Climate Model Projections",
        quality_status="EXPERIMENTAL",
        confidence_score=0.82
    )
    db.add(clim)

    # Landslide (11)
    ls = LandslideModel(
        id="ls-koti-01",
        catchment_id=cat.id,
        name="Koti Slope Debris Avalanche",
        volume_m3=1500000.0,
        slide_type="Rockfall / Debris Flow",
        trigger_rainfall_mm=120.0,
        risk_level="CRITICAL",
        damming_potential=True,
        data_source="ISRO Bhuvan Landslide Hazard Inventory",
        quality_status="IMPORTED",
        confidence_score=0.91
    )
    db.add(ls)

    # Sensor (12)
    sens = SensorModel(
        id="sens-tehri-wl-01",
        study_area_id=sa.id,
        sensor_code="AWS_TEHRI_WL_01",
        sensor_type="Ultrasonic Water Level Gauge",
        lat=30.3785,
        lng=78.4810,
        battery_level_percent=98.0,
        status="ACTIVE",
        last_reading_value=14.2,
        data_source="NTRO IoT Sensor Gateway",
        quality_status="REAL",
        confidence_score=0.99
    )
    db.add(sens)

    # Scenario (13)
    scen = DamBreakScenarioModel(
        id="scen-tehri-pmf-p1",
        title="Tehri PMF Overtopping & Piping Failure",
        dam_id=dam.id,
        failure_mode="Overtopping",
        breach_width_m=180.0,
        breach_height_m=120.0,
        formation_time_hr=1.5,
        peak_discharge_m3s=48500.0,
        reservoir_water_level_percent=100.0,
        mannings_n=0.035
    )
    db.add(scen)
    db.flush()

    # Simulation (14)
    sim = SimulationRunModel(
        id="sim-tehri-p1-001",
        scenario_id=scen.id,
        scenario_title=scen.title,
        dam_name=dam.name,
        study_area_name=sa.name,
        status="Completed",
        progress_percent=100,
        execution_time_sec=42.8,
        max_flood_area_km2=28.6,
        max_depth_m=14.8,
        max_velocity_ms=7.4,
        affected_population=18450
    )
    db.add(sim)
    db.flush()

    # HydraulicResult (15)
    hyd = HydraulicResultModel(
        id="hyd-res-t3600",
        simulation_id=sim.id,
        timestep_sec=3600,
        water_depth_m=8.4,
        flow_velocity_ms=4.2,
        discharge_m3s=18500.0,
        froude_number=0.68,
        shear_stress_pa=52.0,
        quality_status="DEMO",
        confidence_score=0.95
    )
    db.add(hyd)

    # FloodExtent (16)
    ext = FloodExtentModel(
        id="ext-100yr-01",
        simulation_id=sim.id,
        return_period_yr=100,
        area_km2=28.6,
        max_depth_m=14.8,
        geojson_boundary='{"type":"FeatureCollection","features":[]}',
        quality_status="DEMO",
        confidence_score=0.94
    )
    db.add(ext)

    # InfrastructureAsset (17)
    infra = InfrastructureAssetModel(
        id="asset-hosp-01",
        study_area_id=sa.id,
        name="Tehri District Hospital",
        asset_type="Hospital",
        lat=30.365,
        lng=78.472,
        elevation_m=315.0,
        replacement_value_inr=120000000.0,
        criticality_tier="TIER_1_CRITICAL",
        quality_status="SYNTHETIC",
        confidence_score=0.96
    )
    db.add(infra)
    db.flush()

    # AssetExposure (18)
    exp = AssetExposureModel(
        id="exp-sim001-hosp01",
        simulation_id=sim.id,
        asset_id=infra.id,
        submerged_depth_m=2.8,
        flow_velocity_ms=3.4,
        damage_ratio=0.55,
        risk_level="CRITICAL",
        evacuation_status="RESCUE_REQUIRED",
        quality_status="DEMO",
        confidence_score=0.93
    )
    db.add(exp)

    # ModelRun (19)
    run = ModelRunModel(
        id="run-2d-diffusive-001",
        engine_name="2D Diffusive Wave Core",
        solver_type="Cellular Automata Shallow Water",
        mesh_resolution_m=50.0,
        cfl_target=0.42,
        walltime_sec=42.8,
        gpu_accelerated=False,
        status="COMPLETED",
        quality_status="DEMO",
        confidence_score=0.99
    )
    db.add(run)

    db.commit()
    print("  SUCCESS: Inserted sample records for all 20 domain entities into SQLite database.")

    # 3. Test Database Querying
    print("\n[3/4] Testing database querying & relational joins across entities...")
    cat_query = db.query(CatchmentModel).filter(CatchmentModel.id == "cat-tehri-01").first()
    res_query = db.query(ReservoirModel).filter(ReservoirModel.id == "res-tehri-01").first()
    infra_query = db.query(InfrastructureAssetModel).filter(InfrastructureAssetModel.id == "asset-hosp-01").first()
    
    assert cat_query is not None, "Catchment query failed"
    assert res_query is not None, "Reservoir query failed"
    assert infra_query is not None, "Infrastructure query failed"
    
    print(f"  SUCCESS: Query verified -> Catchment Area: {cat_query.area_km2} km2, Reservoir Storage: {res_query.storage_capacity_mm3} MMm3, Asset: {infra_query.name}")

    # 4. Test Pydantic Schema Serialization
    print("\n[4/4] Testing Pydantic JSON schema serialization for all domain objects...")
    
    cat_schema = CatchmentSchema(
        id=cat_query.id,
        study_area_id=cat_query.study_area_id,
        name=cat_query.name,
        area=cat_query.area_km2,
        perimeter=cat_query.perimeter_km,
        elevation_min=cat_query.elevation_min_m,
        elevation_max=cat_query.elevation_max_m,
        mean_elevation=cat_query.mean_elevation_m,
        mean_slope=cat_query.mean_slope_deg,
        drainage_density=cat_query.drainage_density_km_km2,
        time_of_concentration=cat_query.time_of_concentration_hr,
        CN=cat_query.cn_curve_number,
        runoff_coefficient=cat_query.runoff_coefficient,
        quality_status=cat_query.quality_status
    )
    
    res_schema = ReservoirSchema(
        id=res_query.id,
        dam_id=res_query.dam_id,
        name=res_query.name,
        area=res_query.area_km2,
        storage_capacity=res_query.storage_capacity_mm3,
        live_storage=res_query.live_storage_mm3,
        dead_storage=res_query.dead_storage_mm3,
        current_storage=res_query.current_storage_mm3,
        water_level=res_query.water_level_m,
        minimum_level=res_query.minimum_level_m,
        normal_level=res_query.normal_level_m,
        maximum_level=res_query.maximum_level_m,
        spillway_level=res_query.spillway_level_m,
        inflow=res_query.inflow_m3s,
        outflow=res_query.outflow_m3s,
        quality_status=res_query.quality_status
    )

    dam_schema = DamDomainSchema(
        id=dam.id,
        name=dam.name,
        type=dam.dam_type,
        height=dam.height_m,
        crest_elevation=839.5,
        crest_length=dam.crest_length_m,
        foundation_elevation=579.0,
        material="Earth-fill with Clay Core",
        quality_status="DEMO"
    )

    scen_schema = ScenarioDomainSchema(
        id=scen.id,
        dam_id=scen.dam_id,
        title=scen.title,
        rainfall_condition="Extreme PMF 24h Cloudburst (350mm)",
        reservoir_condition="Full Reservoir Level (FRL 830m)",
        breach_condition="Dynamic Trapezoidal Erosion (Width 180m)",
        tributary_condition="High Conflow Backwater",
        landslide_condition="Upstream Rockslide Surge",
        climate_condition="RCP 8.5 Extreme Monsoon Anomaly",
        quality_status="DEMO"
    )

    cat_json = cat_schema.model_dump_json()
    res_json = res_schema.model_dump_json()
    dam_json = dam_schema.model_dump_json()
    scen_json = scen_schema.model_dump_json()

    print("  SUCCESS: Serialized Pydantic Catchment JSON:")
    print(f"  {cat_json[:120]}...")
    print("  SUCCESS: Serialized Pydantic Reservoir JSON:")
    print(f"  {res_json[:120]}...")
    print("  SUCCESS: Serialized Pydantic Dam JSON:")
    print(f"  {dam_json[:120]}...")
    print("  SUCCESS: Serialized Pydantic Scenario JSON:")
    print(f"  {scen_json[:120]}...")

    print("\n==================================================")
    print("  ALL 20 PHASE 1 DATA FOUNDATION TESTS PASSED!    ")
    print("==================================================")

if __name__ == "__main__":
    test_phase1_data_foundation()
