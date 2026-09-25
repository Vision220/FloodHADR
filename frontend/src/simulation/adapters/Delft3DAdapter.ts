import type { HydrodynamicModel } from '../HydrodynamicModel';
import type { ScenarioParams, HydroSimulationState } from '../../types/3dTypes';

export class Delft3DAdapter implements HydrodynamicModel {
  public engineName = "Delft3D-FLOW External HPC Solver";
  public isEngineAvailable = false; // Unconfigured external HPC binary
  public unconfiguredMessage = "Delft3D external engine not configured.";

  initialize(_params: ScenarioParams): void {}
  run(): void {}
  pause(): void {}
  reset(): void {}
  scrubToTime(_timeMin: number): void {}

  getState(): HydroSimulationState {
    return {
      status: 'Ready',
      stage: 'STAGE_1_INTACT',
      stageName: 'Delft3D-FLOW Engine (External Unconfigured)',
      currentTimeMin: 0,
      progressPercent: 0,
      floodedAreaKm2: 0,
      maxDepthM: 0,
      maxVelocityMs: 0,
      waterFrontDistanceM: 0,
      affectedBuildingsCount: 0,
      affectedRoadsKm: 0,
      affectedCriticalInfraCount: 0,
    };
  }

  getWaterDepthAt(_x: number, _z: number): number {
    return 0;
  }
}
