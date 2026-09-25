export type PageId = 
  | 'command-center'
  | 'dashboard'
  | 'legacy-dashboard'
  | 'study-area'
  | 'basin-intelligence'
  | 'dam-reservoir'
  | 'rainfall'
  | 'compound-flood'
  | 'climate'
  | 'landslide'
  | 'multi-model'
  | 'realtime-sensors'
  | 'predictive-ensemble'
  | 'data'
  | 'dam-break'
  | 'simulation'
  | 'simulation-3d'
  | 'flood-map'
  | 'impact-analysis'
  | 'scenario-comparison'
  | 'satellite'
  | 'reports'
  | 'settings'
  | '3d-flood-twin'
  | 'earth-engine';

export type BreachTypeOption = 
  | 'Sudden dam break' 
  | 'Gradual dam break' 
  | 'Controlled water release' 
  | 'River blockage release';

export interface StudyArea {
  id: string;
  name: string;
  state: string;
  river: string;
  damName: string;
  lat: number;
  lng: number;
  demResolution: string;
  areaKm2: number;
  elevationMin: number;
  elevationMax: number;
  isDefault?: boolean;
  coordinates?: { lat: number; lng: number };
  elevationRange?: { min: number; max: number };
  description?: string;
  isDemo?: boolean;
}

export interface DamSpec {
  id: string;
  name: string;
  river: string;
  studyAreaId: string;
  heightM: number;
  crestLengthM: number;
  reservoirVolumeMm3: number;
  fullReservoirLevelM: number;
  currentWaterLevelM: number;
  damType: 'Embankment' | 'Concrete Gravity' | 'Arch' | 'Rockfill';
  constructionYear: number;
  spillwayCapacityM3s: number;
  coordinates?: { lat: number; lng: number };
  isDemo?: boolean;
}

export interface ScenarioFormState {
  scenarioTitle: string;
  // Study Area Inputs
  riverName: string;
  damName: string;
  latitude: number;
  longitude: number;
  // Reservoir Inputs
  reservoirElevationM: number;
  initialWaterDepthM: number;
  reservoirAreaKm2: number;
  storageVolumeMm3: number;
  // Dam Inputs
  damHeightM: number;
  damWidthM: number;
  damCrestElevationM: number;
  // Breach Inputs
  breachWidthM: number;
  finalBreachWidthM: number;
  breachFormationTimeMin: number;
  breachElevationM: number;
  breachType: BreachTypeOption;
  // Simulation Inputs
  simulationDurationHr: number;
  timeStepSec: number;
  manningsN: number;
  gridResolutionM: number;
}

export interface BreachScenario {
  id: string;
  title: string;
  damId: string;
  failureMode: string;
  breachWidthM: number;
  breachHeightM: number;
  formationTimeHr: number;
  peakDischargeM3s: number;
  reservoirWaterLevelPercent: number;
  manningsN: number;
  createdDate: string;
  formState?: ScenarioFormState;
  isDemo?: boolean;
}

export interface SimulationRun {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  damName: string;
  studyAreaName: string;
  status: 'Completed' | 'Running' | 'Queued' | 'Failed';
  progressPercent: number;
  executionTimeSec: number;
  maxFloodAreaKm2: number;
  maxDepthM: number;
  maxVelocityMs: number;
  affectedPopulation: number;
  timeStepsTotal: number;
  currentTimeStepSec: number;
  timestamp: string;
  peakFlowTimeHr: number;
  isDemo?: boolean;
}

export interface DemoStepInfo {
  step: number;
  title: string;
  subtitle: string;
  pageId: PageId;
  durationSec: number;
  summaryText: string;
  detailedExplanation: string;
  hadrContext: string;
}

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: 'Hospital' | 'Power Grid' | 'Bridge' | 'School' | 'Evacuation Center' | 'Substation';
  lat: number;
  lng: number;
  floodDepthM: number;
  status: 'Safe' | 'Warning' | 'Inundated' | 'Critical Submerged';
  capacity: string;
  distanceFromDamKm: number;
}

export interface EvacuationRoute {
  id: string;
  routeName: string;
  originZone: string;
  destinationShelter: string;
  distanceKm: number;
  travelTimeMin: number;
  status: 'Clear & Open' | 'Caution - Moderate Water' | 'Blocked by Flood';
  assignedEvacuees: number;
}

export interface ReportItem {
  id: string;
  title: string;
  date: string;
  type: 'HADR Brief' | 'Hydrodynamic Inundation' | 'GIS Raster Export' | 'Executive Summary';
  scenarioName: string;
  author: string;
  fileSize: string;
}

export interface DEMElevationCell {
  lat: number;
  lng: number;
  elevation: number;
  normalized: number;
}

export interface DEMMetadata {
  id: string;
  filename: string;
  crs: string;
  resolution: string;
  width: number;
  height: number;
  min_elevation: number;
  max_elevation: number;
  mean_elevation: number;
  std_elevation: number;
  pixel_size_x: number;
  pixel_size_y: number;
  approx_cell_meters: number;
  terrain_stats?: {
    elevation_histogram: Array<{ range: string; count: number; min: number; max: number }>;
    average_slope_deg: number;
    flat_area_percent: number;
    steep_area_percent: number;
  };
  sim_grid_summary?: {
    rows: number;
    cols: number;
    cell_size_m: number;
    total_cells: number;
  };
}

export interface DEMPreview {
  id: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  downsampled_rows: number;
  downsampled_cols: number;
  elevation_cells: DEMElevationCell[];
  geojson_boundary: any;
}

export interface RiskThresholdConfig {
  low_max_m: number;
  medium_max_m: number;
  high_max_m: number;
}

export interface AffectedMetrics {
  affected_buildings: number;
  affected_roads_km: number;
  affected_bridges: number;
  affected_schools: number;
  affected_hospitals: number;
  affected_admin_boundaries: number;
  affected_agricultural_area_ha: number;
}

export interface ImpactGISFeature {
  id: string;
  name: string;
  layer: string;
  type: string;
  flood_depth_m: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  subtext: string;
  lat: number;
  lng: number;
  is_synthetic_demo: boolean;
}

export interface HADRImpactResponse {
  simulation_id: string;
  submerged_hospitals_count: number;
  submerged_power_grids_count: number;
  affected_population: number;
  critical_assets: InfrastructureAsset[];
  evacuation_routes: EvacuationRoute[];
  summary_metrics: AffectedMetrics;
  risk_thresholds: RiskThresholdConfig;
  risk_breakdown: Record<string, number>;
  is_synthetic_demo_data: boolean;
  demo_data_notice: string;
  affected_features: ImpactGISFeature[];
}

export interface SatelliteSourceItem {
  id: string;
  name: string;
  description: string;
  resolution: string;
  revisit_days: number;
  recommended_for: string;
}

export interface StudyAreaOption {
  id: string;
  name: string;
  bounds: [number, number, number, number];
}

export interface SatelliteProviderOption {
  id: string;
  name: string;
  is_default: boolean;
  active: boolean;
}

export interface SatelliteMonitoringParams {
  study_area_id: string;
  satellite_source: string;
  before_date: string;
  after_date: string;
  provider_type: string;
  simulation_id?: string;
}

export interface ModelComparisonMetrics {
  satellite_flood_area_km2: number;
  model_flood_area_km2: number;
  true_positive_area_km2: number;
  false_positive_area_km2: number;
  false_negative_area_km2: number;
  intersection_over_union: number;
  critical_success_index: number;
  precision: number;
  recall: number;
  f1_score: number;
  spatial_agreement_percent: number;
}

export interface PipelineStageInfo {
  stage: number;
  name: string;
  status: string;
  summary: string;
}

export interface SatelliteResultResponse {
  status: string;
  study_area_id: string;
  satellite_source: string;
  provider_type: string;
  is_demo_data: boolean;
  notice: string;
  pipeline_stages: PipelineStageInfo[];
  stage_1_acquisition: any;
  stage_2_preprocessing: any;
  stage_3_water_detection: any;
  stage_4_flood_extent: any;
  stage_5_model_comparison: any;
}

export type HydroModelType = 'GRID' | 'SPH' | 'DELFT3D';

export interface EngineStatusItem {
  id: 'GRID' | 'SPH' | 'DELFT3D';
  name: string;
  type: string;
  status: string;
  is_available: boolean;
  badge: string;
  message?: string;
  description: string;
  is_experimental?: boolean;
}

export interface Delft3DConfigResponse {
  status: string;
  engine: string;
  scenario_title: string;
  delft3d_available: boolean;
  notice: string;
  files: {
    mdf_filename: string;
    mdf_content: string;
    dep_filename: string;
    dep_content: string;
    bct_filename: string;
    bct_content: string;
    src_filename: string;
    src_content: string;
  };
}

export interface SPHParticleData {
  id: number;
  x: number;
  y: number;
  z: number;
  velocity_x: number;
  velocity_y: number;
  density: number;
  pressure: number;
  mass: number;
  particle_type: string;
}

export interface SPHFrame {
  frame_index: number;
  time_sec: number;
  particles: SPHParticleData[];
}

export interface SPHRunResponse {
  status: string;
  model_type: string;
  is_experimental_prototype: boolean;
  experimental_notice: string;
  simulation_params: {
    column_width_m: number;
    column_height_m: number;
    domain_length_m: number;
    particle_count: number;
    boundary_particles: number;
    total_time_sec: number;
    total_frames: number;
  };
  summary_metrics: {
    max_velocity_ms: number;
    max_wave_front_m: number;
    execution_time_sec: number;
    particle_count: number;
    mass_conservation_percent: number;
  };
  frames: SPHFrame[];
}

export interface GridVsSPHComparisonResponse {
  disclaimer: string;
  comparison_matrix: Record<string, { grid: any; sph: any }>;
}




