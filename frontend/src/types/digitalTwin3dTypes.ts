export type DataProvenance = 
  | 'OBSERVED' 
  | 'SIMULATED' 
  | 'FORECAST' 
  | 'DERIVED' 
  | 'DEMO' 
  | 'SYNTHETIC' 
  | 'EXPERIMENTAL';

export type MapStyleMode = 'ROADMAP' | 'STREET' | 'SATELLITE' | 'HYBRID' | 'TERRAIN' | 'PHOTOREALISTIC_3D';

export interface GeoReference {
  crs: string;
  originLat: number;
  originLng: number;
  elevationDatum: string;
  boundingBox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  terrainResolutionM: number;
  mapScale: number;
  verticalScale: number;
}

export interface GeoSimulationState {
  selectedLocation: LocationInspectionData | null;
  cameraPosition: { lat: number; lng: number; zoom: number; pitch: number; heading: number };
  zoom: number;
  scenarioId: string;
  simulationTimeMin: number;
  activeLayers: TwinVisualizationLayer[];
  terrainScale: number;
  waterDepthM: number;
  velocityMs: number;
  rainfallMmHr: number;
  reservoirLevelM: number;
  mapStyle: MapStyleMode;
  layoutView: LayoutViewMode;
  alignmentStatus: 'VALIDATED' | 'ALIGNMENT_WARNING';
  alignmentToleranceM: number;
}

export type LayoutViewMode = '2D_ONLY' | '3D_ONLY' | 'SPLIT_VIEW';

export type TwinVisualizationLayer = 
  | 'INUNDATION' 
  | 'DEPTH' 
  | 'VELOCITY' 
  | 'ARRIVAL_TIME' 
  | 'FLOW_DIRECTION' 
  | 'WATER_SURFACE';

export type CameraPresetTarget = 
  | 'PERSPECTIVE' 
  | 'TOP_DOWN' 
  | 'FOCUS_DAM' 
  | 'FOCUS_CONFLUENCE' 
  | 'FOCUS_INFRASTRUCTURE' 
  | 'FOCUS_MAX_DEPTH' 
  | 'NORTH_ALIGN' 
  | 'RESET';

export interface LocationInspectionData {
  lat: number;
  lng: number;
  worldX: number;
  worldZ: number;
  elevationM: number;
  slopeDeg: number;
  waterDepthM: number;
  waterSurfaceM: number;
  velocityMs: number;
  flowDirectionDeg: number;
  arrivalTimeMin: number;
  floodDurationHr: number;
  nearestRiver: string;
  nearestAsset?: string;
  provenance: DataProvenance;
}

export interface RiverBranch3DInfo {
  id: string;
  name: string;
  streamOrder: number;
  lengthKm: number;
  catchmentAreaKm2: number;
  slope: number;
  dischargeM3s: number;
  velocityMs: number;
  depthM: number;
  confluenceNode: string;
  coordinates: [number, number, number][]; // 3D path
}

export interface TwinAsset3D {
  id: string;
  name: string;
  type: 'Residential' | 'School' | 'Hospital' | 'Bridge' | 'Road' | 'Substation' | 'Government' | 'Emergency';
  position: [number, number, number];
  heightM: number;
  elevationM: number;
  isCritical: boolean;
  status: 'SAFE' | 'AT_RISK' | 'SUBMERGED' | 'CRITICAL';
  currentDepthM: number;
  arrivalTimeMin: number;
  provenance: DataProvenance;
}

export interface CrossSectionPoint {
  distanceM: number;
  bedElevationM: number;
  waterSurfaceM: number;
  waterDepthM: number;
}

export interface SimulationFrame {
  timeSec: number;
  timeDisplay: string;
  progressPercent: number;
  waterDepthMatrix: number[][]; // 2D grid
  waterSurfaceElevationMatrix: number[][];
  velocityMatrix: number[][];
  flowDirectionMatrix: number[][];
  inundationMask: boolean[][];
  arrivalTimeMatrix: number[][]; // Arrival time in minutes per grid cell
  floodedAreaKm2: number;
  maxDepthM: number;
  maxVelocityMs: number;
  peakDischargeM3s: number;
  affectedAssetsCount: number;
  breachProgressPercent: number;
}

export interface Flood3DState {
  scenarioId: string;
  scenarioName: string;
  temporalMode: 'PAST' | 'PRESENT' | 'NEXT' | 'FUTURE' | 'EXTREME';
  rainfallMm: number;
  rainfallIntensityMmHr: number;
  cumulativeRainfallMm: number;
  reservoirLevelM: number;
  reservoirStorageMm3: number;
  damBreachWidthM: number;
  breachFormationTimeMin: number;
  tributaryDischargeM3s: number;
  riverDischargeM3s: number;
  manningsN: number;
  climateScaling: number;
  landslideBlockage: 'NONE' | 'PARTIAL' | 'MAJOR_BLOCKAGE';
  
  // Animation state
  playbackSpeed: number; // 0.25, 0.5, 1, 2, 4, 8, 16
  isPlaying: boolean;
  currentTimeMin: number;
  totalDurationMin: number;
  
  // Visual config
  verticalExaggeration: number; // 0.5, 1, 2, 3, 5
  layerMode: TwinVisualizationLayer;
  mapStyle: MapStyleMode;
  layoutView: LayoutViewMode;
  
  // Current frame
  currentFrame: SimulationFrame;
  provenance: DataProvenance;
}
