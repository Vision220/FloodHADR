import type { HydrodynamicModel } from '../HydrodynamicModel';
import type { ScenarioParams, HydroSimulationState } from '../../types/3dTypes';

export class SPHAdapter implements HydrodynamicModel {
  public engineName = "Experimental SPH Particle Demonstrator";
  public isEngineAvailable = true;

  private timeMin = 0;

  initialize(_params: ScenarioParams): void {
    this.timeMin = 0;
  }

  run(): void {}
  pause(): void {}
  reset(): void { this.timeMin = 0; }
  scrubToTime(timeMin: number): void { this.timeMin = timeMin; }

  getState(): HydroSimulationState {
    return {
      status: 'Ready',
      stage: 'STAGE_4_FLOW_ACCELERATION',
      stageName: 'Experimental SPH Particle Hydrodynamics',
      currentTimeMin: this.timeMin,
      progressPercent: 100,
      floodedAreaKm2: 18.4,
      maxDepthM: 12.8,
      maxVelocityMs: 18.4, // High kinetic SPH wave velocity
      waterFrontDistanceM: 140,
      affectedBuildingsCount: 45,
      affectedRoadsKm: 28.5,
      affectedCriticalInfraCount: 3,
    };
  }

  getWaterDepthAt(_x: number, _z: number): number {
    return 0;
  }
}
