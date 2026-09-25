import datetime
from typing import Optional, List
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

# ==========================================
# Provenance & Quality Status Definitions
# ==========================================
# Quality Status: REAL | OBSERVED | FORECAST | IMPORTED | SYNTHETIC | DEMO | EXPERIMENTAL

class DataSourceModel(Base):
    """20. DataSource Entity"""
    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    provider_organization: Mapped[str] = mapped_column(String(200), default="CWC / Survey of India / NTRO")
    source_type: Mapped[str] = mapped_column(String(100), default="DEMO") # REAL | OBSERVED | FORECAST | IMPORTED | SYNTHETIC | DEMO | EXPERIMENTAL
    update_frequency: Mapped[str] = mapped_column(String(100), default="Daily")
    coverage_extent: Mapped[str] = mapped_column(String(200), default="National / Regional")
    license: Mapped[str] = mapped_column(String(100), default="Open Data / Government Confidential")
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    quality_status: Mapped[str] = mapped_column(String(50), default="DEMO")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.95)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)


# ==========================================
# Hydrological & Spatial Entities
# ==========================================

class CatchmentModel(Base):
    """2. Catchment Entity"""
    __tablename__ = "catchments"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    study_area_id: Mapped[str] = mapped_column(String(50), ForeignKey("study_areas.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    area_km2: Mapped[float] = mapped_column(Float, default=1240.0) # area
    perimeter_km: Mapped[float] = mapped_column(Float, default=180.5) # perimeter
    elevation_min_m: Mapped[float] = mapped_column(Float, default=280.0) # elevation_min
    elevation_max_m: Mapped[float] = mapped_column(Float, default=2600.0) # elevation_max
    mean_elevation_m: Mapped[float] = mapped_column(Float, default=1440.0) # mean_elevation
    mean_slope_deg: Mapped[float] = mapped_column(Float, default=14.2) # mean_slope
    drainage_density_km_km2: Mapped[float] = mapped_column(Float, default=2.15) # drainage_density
    time_of_concentration_hr: Mapped[float] = mapped_column(Float, default=6.4) # time_of_concentration
    cn_curve_number: Mapped[float] = mapped_column(Float, default=78.0) # CN
    runoff_coefficient: Mapped[float] = mapped_column(Float, default=0.45) # runoff_coefficient
    
    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="ALOS PALSAR DEM & CWC Hydrology")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="SI Metric")
    quality_status: Mapped[str] = mapped_column(String(50), default="DEMO") # REAL | OBSERVED | FORECAST | IMPORTED | SYNTHETIC | DEMO | EXPERIMENTAL
    confidence_score: Mapped[float] = mapped_column(Float, default=0.92)

    subcatchments: Mapped[List["SubCatchmentModel"]] = relationship("SubCatchmentModel", back_populates="catchment", cascade="all, delete-orphan")


class SubCatchmentModel(Base):
    """3. SubCatchment Entity"""
    __tablename__ = "subcatchments"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    catchment_id: Mapped[str] = mapped_column(String(50), ForeignKey("catchments.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    area_km2: Mapped[float] = mapped_column(Float, default=240.0)
    elevation_mean_m: Mapped[float] = mapped_column(Float, default=1120.0)
    slope_percent: Mapped[float] = mapped_column(Float, default=12.5)
    impervious_percent: Mapped[float] = mapped_column(Float, default=15.0)
    cn_value: Mapped[float] = mapped_column(Float, default=75.0)

    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="GIS Watershed Delineation")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="SI Metric")
    quality_status: Mapped[str] = mapped_column(String(50), default="DEMO")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.90)

    catchment: Mapped["CatchmentModel"] = relationship("CatchmentModel", back_populates="subcatchments")


class RiverBranchModel(Base):
    """5. RiverBranch Entity"""
    __tablename__ = "river_branches"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    river_id: Mapped[str] = mapped_column(String(50), ForeignKey("rivers.id"), nullable=False)
    branch_id: Mapped[str] = mapped_column(String(100), nullable=False) # branch_id
    stream_order: Mapped[int] = mapped_column(Integer, default=4) # stream_order
    length_km: Mapped[float] = mapped_column(Float, default=32.5) # length
    upstream_area_km2: Mapped[float] = mapped_column(Float, default=850.0) # upstream_area
    slope_m_m: Mapped[float] = mapped_column(Float, default=0.006) # slope
    elevation_min_m: Mapped[float] = mapped_column(Float, default=420.0) # elevation_min
    elevation_max_m: Mapped[float] = mapped_column(Float, default=1100.0) # elevation_max
    discharge_m3s: Mapped[float] = mapped_column(Float, default=350.0) # discharge
    velocity_ms: Mapped[float] = mapped_column(Float, default=1.8) # velocity
    depth_m: Mapped[float] = mapped_column(Float, default=3.2) # depth
    confluence_node: Mapped[str] = mapped_column(String(100), default="Bhagirathi-Bhilangna Confluence") # confluence

    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="1D/2D Hydro Network Extraction")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="SI Metric")
    quality_status: Mapped[str] = mapped_column(String(50), default="DEMO")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.94)


class ReservoirModel(Base):
    """7. Reservoir Entity"""
    __tablename__ = "reservoirs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    dam_id: Mapped[str] = mapped_column(String(50), ForeignKey("dams.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    area_km2: Mapped[float] = mapped_column(Float, default=42.0) # area
    storage_capacity_mm3: Mapped[float] = mapped_column(Float, default=3540.0) # storage_capacity
    live_storage_mm3: Mapped[float] = mapped_column(Float, default=2615.0) # live_storage
    dead_storage_mm3: Mapped[float] = mapped_column(Float, default=925.0) # dead_storage
    current_storage_mm3: Mapped[float] = mapped_column(Float, default=3200.0) # current_storage
    water_level_m: Mapped[float] = mapped_column(Float, default=822.4) # water_level
    minimum_level_m: Mapped[float] = mapped_column(Float, default=740.0) # minimum_level
    normal_level_m: Mapped[float] = mapped_column(Float, default=830.0) # normal_level
    maximum_level_m: Mapped[float] = mapped_column(Float, default=835.0) # maximum_level
    spillway_level_m: Mapped[float] = mapped_column(Float, default=815.0) # spillway_level
    inflow_m3s: Mapped[float] = mapped_column(Float, default=1250.0) # inflow
    outflow_m3s: Mapped[float] = mapped_column(Float, default=450.0) # outflow

    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="CWC Reservoir Telemetry")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="SI Metric")
    quality_status: Mapped[str] = mapped_column(String(50), default="DEMO")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.98)


# ==========================================
# Meteorology & Environmental Entities
# ==========================================

class RainfallRecordModel(Base):
    """8. RainfallRecord Entity"""
    __tablename__ = "rainfall_records"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    catchment_id: Mapped[str] = mapped_column(String(50), ForeignKey("catchments.id"), nullable=False)
    station_name: Mapped[str] = mapped_column(String(150), default="Tehri IMD Automatic Weather Station")
    record_timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow) # timestamp
    intensity_mm_hr: Mapped[float] = mapped_column(Float, default=45.0) # intensity
    cumulative_rainfall_mm: Mapped[float] = mapped_column(Float, default=180.0) # cumulative_rainfall
    duration_hr: Mapped[float] = mapped_column(Float, default=4.0) # duration
    source: Mapped[str] = mapped_column(String(100), default="IMD Automatic Rain Gauge Network") # source

    # Provenance attributes
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="mm / hr")
    quality_status: Mapped[str] = mapped_column(String(50), default="OBSERVED")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.96)


class RainfallForecastModel(Base):
    """9. RainfallForecast Entity"""
    __tablename__ = "rainfall_forecasts"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    catchment_id: Mapped[str] = mapped_column(String(50), ForeignKey("catchments.id"), nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), default="NCMRWF GFS 12km Ensemble")
    forecast_timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow) # timestamp
    horizon_hr: Mapped[float] = mapped_column(Float, default=24.0)
    intensity_mm_hr: Mapped[float] = mapped_column(Float, default=65.0) # intensity
    cumulative_rainfall_mm: Mapped[float] = mapped_column(Float, default=240.0) # cumulative_rainfall
    duration_hr: Mapped[float] = mapped_column(Float, default=6.0) # duration
    probability_percent: Mapped[float] = mapped_column(Float, default=85.0)
    source: Mapped[str] = mapped_column(String(100), default="IMD NWP Forecast Feed") # source

    # Provenance attributes
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="mm / hr")
    quality_status: Mapped[str] = mapped_column(String(50), default="FORECAST")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.88)


class ClimateScenarioModel(Base):
    """10. ClimateScenario Entity"""
    __tablename__ = "climate_scenarios"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), default="SSP5-8.5 Extreme Warming & Cloudburst")
    rcp_scenario: Mapped[str] = mapped_column(String(50), default="RCP 8.5")
    temperature_anomaly_c: Mapped[float] = mapped_column(Float, default=3.5)
    precipitation_delta_percent: Mapped[float] = mapped_column(Float, default=28.0)
    extreme_event_frequency_factor: Mapped[float] = mapped_column(Float, default=2.2)
    sea_level_rise_m: Mapped[float] = mapped_column(Float, default=0.0)

    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="IPCC AR6 Regional Climate Model Projections")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="Percentage / Celsius")
    quality_status: Mapped[str] = mapped_column(String(50), default="EXPERIMENTAL")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.82)


class LandslideModel(Base):
    """11. Landslide Entity"""
    __tablename__ = "landslides"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    catchment_id: Mapped[str] = mapped_column(String(50), ForeignKey("catchments.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), default="Koti Slope Debris Avalanche")
    volume_m3: Mapped[float] = mapped_column(Float, default=1500000.0)
    slide_type: Mapped[str] = mapped_column(String(100), default="Rockfall / Debris Flow")
    trigger_rainfall_mm: Mapped[float] = mapped_column(Float, default=120.0)
    risk_level: Mapped[str] = mapped_column(String(50), default="CRITICAL")
    damming_potential: Mapped[bool] = mapped_column(Boolean, default=True)

    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="ISRO Bhuvan Landslide Hazard Inventory")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="m3")
    quality_status: Mapped[str] = mapped_column(String(50), default="IMPORTED")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.91)


class SensorModel(Base):
    """12. Sensor Entity"""
    __tablename__ = "sensors"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    study_area_id: Mapped[str] = mapped_column(String(50), ForeignKey("study_areas.id"), nullable=False)
    sensor_code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    sensor_type: Mapped[str] = mapped_column(String(100), default="Ultrasonic Water Level / Rain Gauge")
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    battery_level_percent: Mapped[float] = mapped_column(Float, default=98.0)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE")
    last_reading_value: Mapped[float] = mapped_column(Float, default=14.2)

    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="NTRO IoT Sensor Gateway")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="Meters / mm")
    quality_status: Mapped[str] = mapped_column(String(50), default="REAL")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.99)


# ==========================================
# Hydrodynamic Results & Asset Exposure
# ==========================================

class HydraulicResultModel(Base):
    """15. HydraulicResult Entity"""
    __tablename__ = "hydraulic_results"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    simulation_id: Mapped[str] = mapped_column(String(50), ForeignKey("simulations.id"), nullable=False)
    timestep_sec: Mapped[int] = mapped_column(Integer, nullable=False)
    water_depth_m: Mapped[float] = mapped_column(Float, nullable=False)
    flow_velocity_ms: Mapped[float] = mapped_column(Float, nullable=False)
    discharge_m3s: Mapped[float] = mapped_column(Float, nullable=False)
    froude_number: Mapped[float] = mapped_column(Float, default=0.65)
    shear_stress_pa: Mapped[float] = mapped_column(Float, default=45.0)

    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="2D Diffusive Wave Engine Cell Grid")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="Meters / Velocity (m/s)")
    quality_status: Mapped[str] = mapped_column(String(50), default="DEMO")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.95)


class FloodExtentModel(Base):
    """16. FloodExtent Entity"""
    __tablename__ = "flood_extents"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    simulation_id: Mapped[str] = mapped_column(String(50), ForeignKey("simulations.id"), nullable=False)
    return_period_yr: Mapped[int] = mapped_column(Integer, default=100)
    area_km2: Mapped[float] = mapped_column(Float, default=28.6)
    max_depth_m: Mapped[float] = mapped_column(Float, default=14.8)
    geojson_boundary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="Raster Depth Threshold Polygon Vectorization")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="EPSG:4326 WGS84 GeoJSON")
    quality_status: Mapped[str] = mapped_column(String(50), default="DEMO")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.94)


class InfrastructureAssetModel(Base):
    """17. InfrastructureAsset Entity"""
    __tablename__ = "infrastructure_assets"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    study_area_id: Mapped[str] = mapped_column(String(50), ForeignKey("study_areas.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(100), default="Hospital") # Hospital | School | Substation | Bridge | Building
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    elevation_m: Mapped[float] = mapped_column(Float, default=320.0)
    replacement_value_inr: Mapped[float] = mapped_column(Float, default=50000000.0)
    criticality_tier: Mapped[str] = mapped_column(String(50), default="TIER_1_CRITICAL")

    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="National GIS Infrastructure Registry")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="Degrees / INR")
    quality_status: Mapped[str] = mapped_column(String(50), default="SYNTHETIC")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.96)


class AssetExposureModel(Base):
    """18. AssetExposure Entity"""
    __tablename__ = "asset_exposures"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    simulation_id: Mapped[str] = mapped_column(String(50), ForeignKey("simulations.id"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String(50), ForeignKey("infrastructure_assets.id"), nullable=False)
    submerged_depth_m: Mapped[float] = mapped_column(Float, default=2.4)
    flow_velocity_ms: Mapped[float] = mapped_column(Float, default=3.1)
    damage_ratio: Mapped[float] = mapped_column(Float, default=0.45)
    risk_level: Mapped[str] = mapped_column(String(50), default="HIGH") # LOW | MEDIUM | HIGH | CRITICAL
    evacuation_status: Mapped[str] = mapped_column(String(100), default="RESCUE_REQUIRED")

    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="GeoPandas Depth Polygon Overlay Engine")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="Ratio / Meters")
    quality_status: Mapped[str] = mapped_column(String(50), default="DEMO")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.93)


class ModelRunModel(Base):
    """19. ModelRun Entity"""
    __tablename__ = "model_runs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    engine_name: Mapped[str] = mapped_column(String(150), default="2D Diffusive Wave Solver")
    solver_type: Mapped[str] = mapped_column(String(100), default="Cellular Automata Finite Volume")
    mesh_resolution_m: Mapped[float] = mapped_column(Float, default=50.0)
    cfl_target: Mapped[float] = mapped_column(Float, default=0.42)
    walltime_sec: Mapped[float] = mapped_column(Float, default=42.8)
    gpu_accelerated: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(50), default="COMPLETED")

    # Provenance attributes
    data_source: Mapped[str] = mapped_column(String(100), default="FloodHADR Execution Log")
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    units: Mapped[str] = mapped_column(String(50), default="Seconds / Meters")
    quality_status: Mapped[str] = mapped_column(String(50), default="DEMO")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.99)
