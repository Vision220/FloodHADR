import type { ScenarioParams, HydroSimulationState } from '../types/3dTypes';

/**
 * Abstract Hydrodynamic Model Interface
 * Defines object-oriented contract for flood propagation simulation engines
 * (Prototype cellular automata, SPH particle model, and Delft3D adapter).
 */
export interface HydrodynamicModel {
  engineName: string;
  isEngineAvailable: boolean;

  /**
   * Initialize simulation state with specified scenario parameters.
   */
  initialize(params: ScenarioParams): void;

  /**
   * Start or resume simulation propagation.
   */
  run(): void;

  /**
   * Pause simulation timeline.
   */
  pause(): void;

  /**
   * Reset simulation timeline to t = 0.
   */
  reset(): void;

  /**
   * Scrub simulation timeline to a specific minute.
   */
  scrubToTime(timeMin: number): void;

  /**
   * Get current live simulation status & metrics.
   */
  getState(): HydroSimulationState;

  /**
   * Get flood elevation grid / depth field at world coordinate (x, z).
   */
  getWaterDepthAt(x: number, z: number): number;
}
