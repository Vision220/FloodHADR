from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

# Study Area Schemas
class StudyAreaBase(BaseModel):
    name: str = Field(..., example="Tehri River Basin & Downstream Valley")
    state: str = Field(..., example="Uttarakhand")
    river: str = Field(..., example="Bhagirathi / Ganga River")
    dam_name: str = Field(..., example="Tehri Dam")
    lat: float = Field(..., example=30.3781)
    lng: float = Field(..., example=78.4802)
    dem_resolution: str = Field("12m ALOS PALSAR", example="12m ALOS PALSAR")
    area_km2: float = Field(1240.0, example=1240.0)
    elevation_min: float = Field(280.0, example=280.0)
    elevation_max: float = Field(2600.0, example=2600.0)
    is_default: bool = Field(False, example=True)

class StudyAreaCreate(StudyAreaBase):
    pass

class StudyAreaResponse(StudyAreaBase):
    id: str

    class Config:
        from_attributes = True


# Dam Schemas
class DamBase(BaseModel):
    name: str = Field(..., example="Tehri Earth and Rockfill Dam")
    river: str = Field(..., example="Bhagirathi River")
    study_area_id: str = Field(..., example="sa-tehri")
    height_m: float = Field(..., example=260.5)
    crest_length_m: float = Field(..., example=575.0)
    reservoir_volume_mm3: float = Field(..., example=3540.0)
    full_reservoir_level_m: float = Field(..., example=830.0)
    current_water_level_m: float = Field(..., example=822.4)
    dam_type: str = Field("Rockfill", example="Rockfill")
    construction_year: int = Field(2006, example=2006)
    spillway_capacity_m3s: float = Field(15540.0, example=15540.0)

class DamCreate(DamBase):
    pass

class DamResponse(DamBase):
    id: str

    class Config:
        from_attributes = True


# River Schemas
class RiverResponse(BaseModel):
    id: str
    name: str
    study_area_id: str
    length_km: float
    average_slope: str

    class Config:
        from_attributes = True


# Dam Break Scenario Schemas
class ScenarioCreate(BaseModel):
    title: str = Field(..., example="Tehri PMF Overtopping Failure")
    dam_id: str = Field(..., example="dam-tehri")
    failure_mode: str = Field(..., example="Overtopping")
    breach_width_m: float = Field(..., example=180.0)
    breach_height_m: float = Field(..., example=120.0)
    formation_time_hr: float = Field(..., example=1.5)
    reservoir_water_level_percent: float = Field(100.0, example=100.0)
    mannings_n: float = Field(0.035, example=0.035)
    form_state_json: Optional[str] = None

class ScenarioResponse(BaseModel):
    id: str
    title: str
    dam_id: str
    failure_mode: str
    breach_width_m: float
    breach_height_m: float
    formation_time_hr: float
    peak_discharge_m3s: float
    reservoir_water_level_percent: float
    mannings_n: float
    created_date: str

    class Config:
        from_attributes = True


# Simulation Schemas
class SimulationCreate(BaseModel):
    scenario_id: str = Field(..., example="scen-tehri-overtop")

class SimulationResponse(BaseModel):
    id: str
    scenario_id: str
    scenario_title: str
    dam_name: str
    study_area_name: str
    status: str
    progress_percent: int
    execution_time_sec: float
    max_flood_area_km2: float
    max_depth_m: float
    max_velocity_ms: float
    affected_population: int
    time_steps_total: int
    current_time_step_sec: int
    peak_flow_time_hr: float

    class Config:
        from_attributes = True

class SimulationStatusResponse(BaseModel):
    id: str
    status: str
    progress_percent: int
    execution_time_sec: float
    current_step: int
    total_steps: int

class HydrographPoint(BaseModel):
    time_hr: float
    discharge_m3s: float
    depth_m: float
    velocity_ms: float

class SimulationResultsResponse(BaseModel):
    simulation_id: str
    scenario_title: str
    max_flood_area_km2: float
    max_depth_m: float
    max_velocity_ms: float
    affected_population: int
    hydrograph: List[HydrographPoint]
    inundation_geojson: Dict[str, Any]

class RiskThresholdConfig(BaseModel):
    low_max_m: float = Field(0.5, example=0.5, description="Upper bound depth for LOW risk (meters)")
    medium_max_m: float = Field(1.5, example=1.5, description="Upper bound depth for MEDIUM risk (meters)")
    high_max_m: float = Field(3.0, example=3.0, description="Upper bound depth for HIGH risk (meters, >= is CRITICAL)")

class HADRImpactRequest(BaseModel):
    simulation_id: Optional[str] = Field("sim-tehri-001", example="sim-tehri-001")
    risk_thresholds: Optional[RiskThresholdConfig] = None

class AffectedMetrics(BaseModel):
    affected_buildings: int
    affected_roads_km: float
    affected_bridges: int
    affected_schools: int
    affected_hospitals: int
    affected_admin_boundaries: int
    affected_agricultural_area_ha: float

class CriticalAsset(BaseModel):
    name: str
    type: str
    flood_depth_m: float
    status: str
    distance_km: float
    risk_level: str = "HIGH"

class EvacuationRouteInfo(BaseModel):
    route_name: str
    origin_zone: str
    destination_shelter: str
    distance_km: float
    travel_time_min: int
    status: str
    assigned_evacuees: int

class ImpactAnalysisResponse(BaseModel):
    simulation_id: str
    submerged_hospitals_count: int
    submerged_power_grids_count: int
    affected_population: int
    critical_assets: List[CriticalAsset]
    evacuation_routes: List[EvacuationRouteInfo]
    summary_metrics: AffectedMetrics
    risk_thresholds: RiskThresholdConfig
    risk_breakdown: Dict[str, int]
    is_synthetic_demo_data: bool = True
    demo_data_notice: str = "DEMO NOTICE: GIS layers shown are synthetic demonstration layers generated for decision support modeling. They do not represent real-world ground survey observations."
    affected_features: List[Dict[str, Any]]


# DEM Schemas
class DEMMetadataResponse(BaseModel):
    id: str
    filename: str
    crs: str
    resolution: str
    width: int
    height: int
    min_elevation: float
    max_elevation: float
    mean_elevation: float
    std_elevation: float
    pixel_size_x: float
    pixel_size_y: float
    approx_cell_meters: float
    terrain_stats: Dict[str, Any]
    sim_grid_summary: Dict[str, Any]

class DEMPreviewResponse(BaseModel):
    id: str
    bounds: List[List[float]]
    center: List[float]
    downsampled_rows: int
    downsampled_cols: int
    elevation_cells: List[Dict[str, Any]]
    geojson_boundary: Dict[str, Any]

