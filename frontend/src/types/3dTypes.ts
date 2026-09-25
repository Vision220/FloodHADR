export type ScenarioId = 'scenario-a' | 'scenario-b' | 'scenario-c' | 'custom';

export type MapVisualizationMode = 'depth' | 'velocity' | 'inundation';

export type CameraPreset = '3D' | 'TOP' | 'DAM' | 'DOWNSTREAM' | 'RESET';

export type SimulationStage = 
  | 'STAGE_1_INTACT'
  | 'STAGE_2_BREACH_INIT'
  | 'STAGE_3_WATER_ESCAPE'
  | 'STAGE_4_FLOW_ACCELERATION'
  | 'STAGE_5_WAVE_PROPAGATION'
  | 'STAGE_6_MAX_INUNDATION';

export interface ScenarioParams {
  id: ScenarioId;
  name: string;
  description: string;
  reservoirWaterLevelM: number;
  reservoirStorageMm3: number;
  reservoirAreaKm2: number;
  damHeightM: number;
  damLengthM: number;
  breachWidthM: number;
  finalBreachWidthM: number;
  breachFormationTimeMin: number;
  simulationDurationMin: number;
  terrainScale: number;
  floodSpeedMultiplier: number;
}

export interface HydroSimulationState {
  status: 'Ready' | 'Breaching' | 'Simulating' | 'Paused' | 'Completed';
  stage: SimulationStage;
  stageName: string;
  currentTimeMin: number;
  progressPercent: number;
  floodedAreaKm2: number;
  maxDepthM: number;
  maxVelocityMs: number;
  waterFrontDistanceM: number;
  affectedBuildingsCount: number;
  affectedRoadsKm: number;
  affectedCriticalInfraCount: number;
}

export interface InfrastructureBuilding {
  id: string;
  name: string;
  type: 'Residential' | 'School' | 'Hospital' | 'Substation' | 'Bridge';
  position: [number, number, number]; // [x, y, z] in Three.js world space
  elevation: number;
  isCritical: boolean;
  status: 'NORMAL' | 'FLOOD AFFECTED' | 'FLOOD IMPACT';
  subtext: string;
  affectedAtMin?: number;
  currentDepthM: number;
}

export interface TerrainGridData {
  width: number;
  height: number;
  segmentsX: number;
  segmentsY: number;
  elevationMatrix: number[][]; // 2D array of elevations
  riverPath: [number, number][]; // Array of [x, z] coordinates along river center
}
