import type { HydrodynamicModel } from './HydrodynamicModel';
import type { ScenarioParams, HydroSimulationState, SimulationStage } from '../types/3dTypes';

export class PrototypeFloodModel implements HydrodynamicModel {
  public engineName = "Prototype 2D Diffusive Wave Model";
  public isEngineAvailable = true;

  private params: ScenarioParams;
  private state: HydroSimulationState;
  private isRunning = false;

  constructor(initialParams: ScenarioParams) {
    this.params = initialParams;
    this.state = this.calculateInitialState();
  }

  private calculateInitialState(): HydroSimulationState {
    return {
      status: 'Ready',
      stage: 'STAGE_1_INTACT',
      stageName: 'Stage 1: Dam Intact (Baseline Reservoir)',
      currentTimeMin: 0,
      progressPercent: 0,
      floodedAreaKm2: 0.8, // Baseline river channel area
      maxDepthM: 2.2, // Normal river depth
      maxVelocityMs: 1.4, // Normal river velocity
      waterFrontDistanceM: 0, // Distance downstream from dam (Z = -30)
      affectedBuildingsCount: 0,
      affectedRoadsKm: 0,
      affectedCriticalInfraCount: 0,
    };
  }

  public initialize(params: ScenarioParams): void {
    this.params = params;
    this.reset();
  }

  public run(): void {
    this.isRunning = true;
    this.state.status = 'Simulating';
  }

  public pause(): void {
    this.isRunning = false;
    this.state.status = 'Paused';
  }

  public reset(): void {
    this.isRunning = false;
    this.state = this.calculateInitialState();
  }

  public scrubToTime(timeMin: number): void {
    const clampedTime = Math.max(0, Math.min(this.params.simulationDurationMin, timeMin));
    this.updateStateForTime(clampedTime);
  }

  public getState(): HydroSimulationState {
    return { ...this.state };
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Internal calculation updating physical simulation metrics for time t (minutes).
   */
  public updateStateForTime(t: number): void {
    this.state.currentTimeMin = Math.round(t * 10) / 10;
    this.state.progressPercent = Math.min(100, Math.round((t / this.params.simulationDurationMin) * 100));

    // Determine 6 Simulation Stages
    let stage: SimulationStage = 'STAGE_1_INTACT';
    let stageName = 'Stage 1: Dam Intact (Normal Reservoir)';

    if (t >= 10 && t < 20) {
      stage = 'STAGE_2_BREACH_INIT';
      stageName = 'Stage 2: Breach Initiation (Piping / Erosion Starts)';
    } else if (t >= 20 && t < 30) {
      stage = 'STAGE_3_WATER_ESCAPE';
      stageName = 'Stage 3: Water Escape (Initial Breach Jet Discharge)';
    } else if (t >= 30 && t < 60) {
      stage = 'STAGE_4_FLOW_ACCELERATION';
      stageName = 'Stage 4: Flow Acceleration (Peak Outflow Surge)';
    } else if (t >= 60 && t < 90) {
      stage = 'STAGE_5_WAVE_PROPAGATION';
      stageName = 'Stage 5: Wave Propagation (Valley Inundation Spreading)';
    } else if (t >= 90) {
      stage = 'STAGE_6_MAX_INUNDATION';
      stageName = 'Stage 6: Maximum Inundation Envelope Reached';
    }

    this.state.stage = stage;
    this.state.stageName = stageName;

    // Calculate Water Front Propagation Distance Downstream (Z-axis, from 0m to 210m)
    // Breach starts at t = 10 min
    let frontDist = 0;
    if (t > 10) {
      const dtBreach = t - 10;
      const speed = (this.params.breachWidthM / 100) * 2.2 * this.params.floodSpeedMultiplier;
      frontDist = Math.min(210, dtBreach * speed * 2.5);
    }
    this.state.waterFrontDistanceM = Math.round(frontDist);

    // Calculate Inundated Area, Max Depth, and Max Velocity
    if (t <= 10) {
      this.state.floodedAreaKm2 = 0.8;
      this.state.maxDepthM = 2.2;
      this.state.maxVelocityMs = 1.4;
      this.state.affectedBuildingsCount = 0;
      this.state.affectedRoadsKm = 0;
      this.state.affectedCriticalInfraCount = 0;
    } else {
      const factor = Math.min(1.0, (t - 10) / 80);
      const breachFactor = this.params.breachWidthM / 100;
      const levelFactor = this.params.reservoirWaterLevelM / 240;

      this.state.floodedAreaKm2 = Math.round((0.8 + factor * 26.4 * breachFactor * levelFactor) * 10) / 10;
      this.state.maxDepthM = Math.round((2.2 + factor * 12.6 * levelFactor) * 10) / 10;
      this.state.maxVelocityMs = Math.round((1.4 + factor * 6.8 * breachFactor) * 10) / 10;

      // Affected Infrastructure counts based on wave front position
      if (frontDist > 40) {
        this.state.affectedBuildingsCount = Math.min(110, Math.round((frontDist - 40) * 0.7));
        this.state.affectedRoadsKm = Math.round((frontDist - 40) * 0.4 * 10) / 10;
      }
      if (frontDist > 65) this.state.affectedCriticalInfraCount = 1; // Bridge
      if (frontDist > 90) this.state.affectedCriticalInfraCount = 2; // School
      if (frontDist > 120) this.state.affectedCriticalInfraCount = 3; // Substation
      if (frontDist > 150) this.state.affectedCriticalInfraCount = 4; // Hospital
    }

    if (t >= this.params.simulationDurationMin) {
      this.state.status = 'Completed';
    }
  }

  /**
   * Get dynamic flood depth at 3D world coordinate (x, z).
   * Dam is at Z = -30. Valley runs from Z = -30 to Z = 180.
   */
  public getWaterDepthAt(x: number, z: number): number {
    if (z < -30) {
      // Inside Reservoir
      return this.params.reservoirWaterLevelM / 20; // Visual height in 3D units
    }

    const distFromDam = z - (-30);
    if (distFromDam > this.state.waterFrontDistanceM) {
      // Beyond flood wave front
      return 0;
    }

    // River channel center is around X = 0
    const distFromCenter = Math.abs(x);

    // Flood spread width expands as wave moves downstream
    const spreadWidth = 15 + (distFromDam * 0.25) * (this.params.breachWidthM / 100);

    if (distFromCenter > spreadWidth) {
      return 0;
    }

    // Depth decays from river center outward and downstream
    const centerFactor = 1.0 - (distFromCenter / spreadWidth);
    const frontFactor = Math.max(0.1, 1.0 - (distFromDam / (this.state.waterFrontDistanceM + 1)));

    const depthM = (this.state.maxDepthM * centerFactor * frontFactor);
    return Math.max(0, depthM);
  }
}
