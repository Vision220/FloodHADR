from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import datetime

# Quality Status Enum Values: REAL | OBSERVED | FORECAST | IMPORTED | SYNTHETIC | DEMO | EXPERIMENTAL

# Base Provenance Schema inherited by all 20 Phase 1 Domain Objects
class ProvenanceSchema(BaseModel):
    data_source: str = Field("CWC Telemetry / ALOS PALSAR DEM / NTRO DSS", example="CWC Telemetry / ALOS PALSAR DEM")
    timestamp: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat(), example="2026-09-24T19:30:00Z")
    units: str = Field("SI Metric", example="SI Metric")
    quality_status: str = Field("DEMO", example="DEMO", description="REAL | OBSERVED | FORECAST | IMPORTED | SYNTHETIC | DEMO | EXPERIMENTAL")
    confidence_score: float = Field(0.95, example=0.95, ge=0.0, le=1.0)


# 1. StudyArea Schema
class StudyAreaDomainSchema(ProvenanceSchema):
    id: str = Field(..., example="sa-tehri-demo")
    name: str = Field(..., example="Tehri River Basin & Downstream Valley")
    state: str = Field("Uttarakhand", example="Uttarakhand")
    river: str = Field("Bhagirathi River", example="Bhagirathi River")
    lat: float = Field(30.3781, example=30.3781)
    lng: float = Field(78.4802, example=78.4802)
    area_km2: float = Field(1240.0, example=1240.0)
    elevation_min_m: float = Field(280.0, example=280.0)
    elevation_max_m: float = Field(2600.0, example=2600.0)


# 2. Catchment Schema
class CatchmentSchema(ProvenanceSchema):
    id: str = Field(..., example="cat-bhagirathi-001")
    study_area_id: str = Field(..., example="sa-tehri-demo")
    name: str = Field(..., example="Upper Bhagirathi Catchment")
    area: float = Field(1240.0, example=1240.0) # area
    perimeter: float = Field(180.5, example=180.5) # perimeter
    elevation_min: float = Field(280.0, example=280.0) # elevation_min
    elevation_max: float = Field(2600.0, example=2600.0) # elevation_max
    mean_elevation: float = Field(1440.0, example=1440.0) # mean_elevation
    mean_slope: float = Field(14.2, example=14.2) # mean_slope
    drainage_density: float = Field(2.15, example=2.15) # drainage_density
    time_of_concentration: float = Field(6.4, example=6.4) # time_of_concentration
    CN: float = Field(78.0, example=78.0) # CN
    runoff_coefficient: float = Field(0.45, example=0.45) # runoff_coefficient


# 3. SubCatchment Schema
class SubCatchmentSchema(ProvenanceSchema):
    id: str = Field(..., example="subcat-koti-01")
    catchment_id: str = Field(..., example="cat-bhagirathi-001")
    name: str = Field(..., example="Koti Nala Sub-Catchment")
    area_km2: float = Field(240.0, example=240.0)
    elevation_mean_m: float = Field(1120.0, example=1120.0)
    slope_percent: float = Field(12.5, example=12.5)
    impervious_percent: float = Field(15.0, example=15.0)
    cn_value: float = Field(75.0, example=75.0)


# 4. River Schema
class RiverDomainSchema(ProvenanceSchema):
    id: str = Field(..., example="riv-bhagirathi-001")
    name: str = Field(..., example="Bhagirathi River Main Reach")
    study_area_id: str = Field(..., example="sa-tehri-demo")
    length_km: float = Field(65.4, example=65.4)
    average_slope: str = Field("0.005 m/m", example="0.005 m/m")


# 5. RiverBranch Schema
class RiverBranchSchema(ProvenanceSchema):
    id: str = Field(..., example="rb-bhagirathi-br1")
    river_id: str = Field(..., example="riv-bhagirathi-001")
    branch_id: str = Field(..., example="BR_BHAGIRATHI_MAIN") # branch_id
    stream_order: int = Field(5, example=5) # stream_order
    length: float = Field(32.5, example=32.5) # length
    upstream_area: float = Field(850.0, example=850.0) # upstream_area
    slope: float = Field(0.006, example=0.006) # slope
    elevation_min: float = Field(420.0, example=420.0) # elevation_min
    elevation_max: float = Field(1100.0, example=1100.0) # elevation_max
    discharge: float = Field(350.0, example=350.0) # discharge
    velocity: float = Field(1.8, example=1.8) # velocity
    depth: float = Field(3.2, example=3.2) # depth
    confluence: str = Field("Tehri Confluence Node", example="Tehri Confluence Node") # confluence


# 6. Dam Schema
class DamDomainSchema(ProvenanceSchema):
    id: str = Field(..., example="dam-tehri-demo")
    name: str = Field(..., example="Tehri Earth and Rockfill Dam") # name
    type: str = Field("Rockfill", example="Rockfill") # type
    height: float = Field(260.5, example=260.5) # height
    crest_elevation: float = Field(839.5, example=839.5) # crest_elevation
    crest_length: float = Field(575.0, example=575.0) # crest_length
    foundation_elevation: float = Field(579.0, example=579.0) # foundation_elevation
    material: str = Field("Earth-fill with Clay Core", example="Earth-fill with Clay Core") # material


# 7. Reservoir Schema
class ReservoirSchema(ProvenanceSchema):
    id: str = Field(..., example="res-tehri-001")
    dam_id: str = Field(..., example="dam-tehri-demo")
    name: str = Field(..., example="Tehri Hydroelectric Reservoir")
    area: float = Field(42.0, example=42.0) # area
    storage_capacity: float = Field(3540.0, example=3540.0) # storage_capacity
    live_storage: float = Field(2615.0, example=2615.0) # live_storage
    dead_storage: float = Field(925.0, example=925.0) # dead_storage
    current_storage: float = Field(3200.0, example=3200.0) # current_storage
    water_level: float = Field(822.4, example=822.4) # water_level
    minimum_level: float = Field(740.0, example=740.0) # minimum_level
    normal_level: float = Field(830.0, example=830.0) # normal_level
    maximum_level: float = Field(835.0, example=835.0) # maximum_level
    spillway_level: float = Field(815.0, example=815.0) # spillway_level
    inflow: float = Field(1250.0, example=1250.0) # inflow
    outflow: float = Field(450.0, example=450.0) # outflow


# 8. RainfallRecord Schema
class RainfallRecordSchema(ProvenanceSchema):
    id: str = Field(..., example="rf-rec-20260815-01")
    catchment_id: str = Field(..., example="cat-bhagirathi-001")
    timestamp: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat(), example="2026-08-15T12:00:00Z") # timestamp
    intensity: float = Field(45.0, example=45.0) # intensity
    cumulative_rainfall: float = Field(180.0, example=180.0) # cumulative_rainfall
    duration: float = Field(4.0, example=4.0) # duration
    source: str = Field("IMD Automatic Weather Station Tehri", example="IMD Automatic Weather Station Tehri") # source


# 9. RainfallForecast Schema
class RainfallForecastSchema(ProvenanceSchema):
    id: str = Field(..., example="rf-fcst-gfs-01")
    catchment_id: str = Field(..., example="cat-bhagirathi-001")
    model_name: str = Field("NCMRWF GFS 12km Ensemble", example="NCMRWF GFS 12km Ensemble")
    timestamp: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat(), example="2026-08-15T18:00:00Z") # timestamp
    intensity: float = Field(65.0, example=65.0) # intensity
    cumulative_rainfall: float = Field(240.0, example=240.0) # cumulative_rainfall
    duration: float = Field(6.0, example=6.0) # duration
    probability_percent: float = Field(85.0, example=85.0)
    source: str = Field("IMD NWP Forecast Feed", example="IMD NWP Forecast Feed") # source


# 10. ClimateScenario Schema
class ClimateScenarioSchema(ProvenanceSchema):
    id: str = Field(..., example="clim-rcp85-ssp5")
    name: str = Field("SSP5-8.5 Extreme Cloudburst & GLOF", example="SSP5-8.5 Extreme Cloudburst & GLOF")
    rcp_scenario: str = Field("RCP 8.5", example="RCP 8.5")
    temperature_anomaly_c: float = Field(3.5, example=3.5)
    precipitation_delta_percent: float = Field(28.0, example=28.0)
    extreme_event_frequency_factor: float = Field(2.2, example=2.2)
    sea_level_rise_m: float = Field(0.0, example=0.0)


# 11. Landslide Schema
class LandslideSchema(ProvenanceSchema):
    id: str = Field(..., example="ls-koti-001")
    catchment_id: str = Field(..., example="cat-bhagirathi-001")
    name: str = Field("Koti Slope Rockfall Avalanche", example="Koti Slope Rockfall Avalanche")
    volume_m3: float = Field(1500000.0, example=1500000.0)
    slide_type: str = Field("Rockfall Debris Flow", example="Rockfall Debris Flow")
    trigger_rainfall_mm: float = Field(120.0, example=120.0)
    risk_level: str = Field("CRITICAL", example="CRITICAL")
    damming_potential: bool = Field(True, example=True)


# 12. Sensor Schema
class SensorSchema(ProvenanceSchema):
    id: str = Field(..., example="sens-tehri-wl-01")
    study_area_id: str = Field(..., example="sa-tehri-demo")
    sensor_code: str = Field("AWS_TEHRI_WL_01", example="AWS_TEHRI_WL_01")
    sensor_type: str = Field("Radar Water Level Gauge", example="Radar Water Level Gauge")
    lat: float = Field(30.3785, example=30.3785)
    lng: float = Field(78.4810, example=78.4810)
    battery_level_percent: float = Field(98.0, example=98.0)
    status: str = Field("ACTIVE", example="ACTIVE")
    last_reading_value: float = Field(14.2, example=14.2)


# 13. Scenario Schema
class ScenarioDomainSchema(ProvenanceSchema):
    id: str = Field(..., example="scen-demo-pmf-001")
    dam_id: str = Field(..., example="dam-tehri-demo")
    title: str = Field("PMF Overtopping & Piping Failure", example="PMF Overtopping & Piping Failure")
    rainfall_condition: str = Field("Extreme PMF 24h Cloudburst (350mm)", example="Extreme PMF 24h Cloudburst (350mm)") # rainfall condition
    reservoir_condition: str = Field("Full Reservoir Level (FRL 830m)", example="Full Reservoir Level (FRL 830m)") # reservoir condition
    breach_condition: str = Field("Dynamic Trapezoidal Erosion (Width 120m, Time 1.5h)", example="Dynamic Trapezoidal Erosion") # breach condition
    tributary_condition: str = Field("High Conflow Backwater from Bhilangna River", example="High Conflow Backwater") # tributary condition
    landslide_condition: str = Field("Upstream Rockslide Surge (Volume 1.5M m3)", example="Upstream Rockslide Surge") # landslide condition
    climate_condition: str = Field("RCP 8.5 Extreme Monsoon Anomaly", example="RCP 8.5 Extreme Monsoon Anomaly") # climate condition


# 14. Simulation Schema
class SimulationDomainSchema(ProvenanceSchema):
    id: str = Field(..., example="sim-demo-package-001")
    scenario_id: str = Field(..., example="scen-demo-pmf-001")
    scenario_title: str = Field("PMF Overtopping Failure", example="PMF Overtopping Failure")
    dam_name: str = Field("Tehri Dam", example="Tehri Dam")
    study_area_name: str = Field("Tehri Basin", example="Tehri Basin")
    status: str = Field("COMPLETED", example="COMPLETED")
    execution_time_sec: float = Field(42.8, example=42.8)
    max_flood_area_km2: float = Field(28.6, example=28.6)
    max_depth_m: float = Field(14.8, example=14.8)
    max_velocity_ms: float = Field(7.4, example=7.4)
    affected_population: int = Field(18450, example=18450)


# 15. HydraulicResult Schema
class HydraulicResultSchema(ProvenanceSchema):
    id: str = Field(..., example="hyd-res-sim001-t3600")
    simulation_id: str = Field(..., example="sim-demo-package-001")
    timestep_sec: int = Field(3600, example=3600)
    water_depth_m: float = Field(8.4, example=8.4)
    flow_velocity_ms: float = Field(4.2, example=4.2)
    discharge_m3s: float = Field(18500.0, example=18500.0)
    froude_number: float = Field(0.68, example=0.68)
    shear_stress_pa: float = Field(52.0, example=52.0)


# 16. FloodExtent Schema
class FloodExtentSchema(ProvenanceSchema):
    id: str = Field(..., example="ext-sim001-100yr")
    simulation_id: str = Field(..., example="sim-demo-package-001")
    return_period_yr: int = Field(100, example=100)
    area_km2: float = Field(28.6, example=28.6)
    max_depth_m: float = Field(14.8, example=14.8)
    geojson_boundary: Optional[Dict[str, Any]] = None


# 17. InfrastructureAsset Schema
class InfrastructureAssetSchema(ProvenanceSchema):
    id: str = Field(..., example="asset-hosp-tehri-01")
    study_area_id: str = Field(..., example="sa-tehri-demo")
    name: str = Field("Tehri District Hospital", example="Tehri District Hospital")
    asset_type: str = Field("Hospital", example="Hospital")
    lat: float = Field(30.365, example=30.365)
    lng: float = Field(78.472, example=78.472)
    elevation_m: float = Field(315.0, example=315.0)
    replacement_value_inr: float = Field(120000000.0, example=120000000.0)
    criticality_tier: str = Field("TIER_1_CRITICAL", example="TIER_1_CRITICAL")


# 18. AssetExposure Schema
class AssetExposureSchema(ProvenanceSchema):
    id: str = Field(..., example="exp-sim001-hosp01")
    simulation_id: str = Field(..., example="sim-demo-package-001")
    asset_id: str = Field(..., example="asset-hosp-tehri-01")
    submerged_depth_m: float = Field(2.8, example=2.8)
    flow_velocity_ms: float = Field(3.4, example=3.4)
    damage_ratio: float = Field(0.55, example=0.55)
    risk_level: str = Field("CRITICAL", example="CRITICAL")
    evacuation_status: str = Field("RESCUE_REQUIRED", example="RESCUE_REQUIRED")


# 19. ModelRun Schema
class ModelRunSchema(ProvenanceSchema):
    id: str = Field(..., example="run-2d-diffusive-001")
    engine_name: str = Field("2D Diffusive Wave Core", example="2D Diffusive Wave Core")
    solver_type: str = Field("Cellular Automata Shallow Water", example="Cellular Automata Shallow Water")
    mesh_resolution_m: float = Field(50.0, example=50.0)
    cfl_target: float = Field(0.42, example=0.42)
    walltime_sec: float = Field(42.8, example=42.8)
    gpu_accelerated: bool = Field(False, example=False)
    status: str = Field("COMPLETED", example="COMPLETED")


# 20. DataSource Schema
class DataSourceSchema(ProvenanceSchema):
    id: str = Field(..., example="ds-cwc-telemetry")
    name: str = Field("Central Water Commission Hydrologic Feed", example="Central Water Commission Hydrologic Feed")
    provider_organization: str = Field("Central Water Commission (CWC)", example="Central Water Commission (CWC)")
    source_type: str = Field("OBSERVED", example="OBSERVED") # REAL | OBSERVED | FORECAST | IMPORTED | SYNTHETIC | DEMO | EXPERIMENTAL
    update_frequency: str = Field("Hourly", example="Hourly")
    coverage_extent: str = Field("Bhagirathi & Ganges Basin", example="Bhagirathi & Ganges Basin")
    license: str = Field("Government Open Data License (GODL-India)", example="Government Open Data License (GODL-India)")
    url: Optional[str] = Field("https://cwc.gov.in", example="https://cwc.gov.in")
