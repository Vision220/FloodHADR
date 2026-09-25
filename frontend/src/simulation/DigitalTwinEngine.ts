import type { SimulationFrame, Flood3DState } from '../types/digitalTwin3dTypes';

export class DigitalTwinEngine {
  private gridRows = 30;
  private gridCols = 30;

  // Cache terrain elevation matrix (Tehri DEM valley shape)
  private elevationMatrix: number[][];

  constructor() {
    this.elevationMatrix = this.generateTehriDemMatrix(this.gridRows, this.gridCols);
  }

  public getElevationMatrix(): number[][] {
    return this.elevationMatrix;
  }

  /**
   * Generates a realistic DEM elevation matrix for the Tehri Dam & Bhagirathi River Gorge.
   * High elevations on sides (hills 1500-2400m), low gorge in center (down to 600m).
   */
  private generateTehriDemMatrix(rows: number, cols: number): number[][] {
    const dem: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      const normR = r / (rows - 1); // 0 (upstream Tehri Reservoir) to 1 (downstream Devprayag)
      for (let c = 0; c < cols; c++) {
        const normC = c / (cols - 1); // 0 (left ridge) to 1 (right ridge)

        // River channel runs down middle (around normC = 0.5)
        const distFromRiver = Math.abs(normC - 0.5);
        
        // Elevation profile: Tehri reservoir at 830m down to valley 500m
        const baseElevation = 830 - normR * 330;
        const valleyWallHeight = Math.pow(distFromRiver * 2.2, 1.8) * 950;
        
        // Add realistic mountain ridges & tributary valleys
        const ridgeNoise = Math.sin(normR * Math.PI * 4 + normC * Math.PI * 2) * 45;
        const elevation = Math.max(380, Math.round((baseElevation + valleyWallHeight + ridgeNoise) * 10) / 10);
        
        row.push(elevation);
      }
      dem.push(row);
    }
    return dem;
  }

  /**
   * Evaluates the simulation state at a specific time (currentTimeMin) and returns a complete SimulationFrame.
   */
  public generateFrame(state: Flood3DState, timeMin: number): SimulationFrame {
    const progress = Math.min(1.0, Math.max(0, timeMin / state.totalDurationMin));

    // Base discharge & velocity calculations
    let peakQ = 4500 + state.rainfallMm * 48.0 * (state.rainfallIntensityMmHr / 30.0);
    if (state.tributaryDischargeM3s > 0) peakQ += state.tributaryDischargeM3s;
    peakQ *= state.climateScaling;

    if (state.landslideBlockage === 'PARTIAL') peakQ += 1800;
    if (state.landslideBlockage === 'MAJOR_BLOCKAGE') peakQ += 4200;

    // Breach dynamics
    let breachProgress = 0;
    if (state.damBreachWidthM > 0 || state.reservoirLevelM > 832) {
      breachProgress = Math.min(1.0, timeMin / Math.max(1, state.breachFormationTimeMin));
      peakQ += breachProgress * 410000;
    }

    const currentQ = Math.round(peakQ * Math.sin(Math.min(Math.PI, progress * Math.PI)));
    const maxDepth = Math.round((Math.pow(currentQ + 100, 0.38) * 0.45) * 10) / 10;
    const maxVel = Math.round((Math.pow(currentQ + 100, 0.22) * 0.88) * 10) / 10;

    // Compute matrices
    const depthMatrix: number[][] = [];
    const surfaceMatrix: number[][] = [];
    const velMatrix: number[][] = [];
    const dirMatrix: number[][] = [];
    const inundationMask: boolean[][] = [];
    const arrivalTimeMatrix: number[][] = [];

    let floodedCells = 0;
    const waveFrontRow = Math.floor(progress * (this.gridRows + 4));

    for (let r = 0; r < this.gridRows; r++) {
      const rDepth: number[] = [];
      const rSurf: number[] = [];
      const rVel: number[] = [];
      const rDir: number[] = [];
      const rInund: boolean[] = [];
      const rArrival: number[] = [];

      for (let c = 0; c < this.gridCols; c++) {
        const terrainElev = this.elevationMatrix[r][c];
        const distFromCenter = Math.abs(c - (this.gridCols / 2));

        // Wave reaches cell if row is before wave front and cell is close enough to channel
        const isFloodedCell = r <= waveFrontRow && distFromCenter <= (2 + maxDepth * 0.45);

        if (isFloodedCell) {
          floodedCells++;
          // Depth decreases away from center
          const cellDepth = Math.max(0.1, Math.round((maxDepth * Math.max(0.05, 1 - distFromCenter / (3 + maxDepth * 0.4))) * 10) / 10);
          const cellVel = Math.max(0.2, Math.round((maxVel * (0.6 + Math.random() * 0.4)) * 10) / 10);
          const arrivalMin = Math.round((r * 2.5 + distFromCenter * 0.8) * 10) / 10;

          rDepth.push(cellDepth);
          rSurf.push(terrainElev + cellDepth);
          rVel.push(cellVel);
          rDir.push(180 + (c - this.gridCols / 2) * 15); // Downstream flow vector
          rInund.push(true);
          rArrival.push(arrivalMin);
        } else {
          rDepth.push(0);
          rSurf.push(terrainElev);
          rVel.push(0);
          rDir.push(0);
          rInund.push(false);
          rArrival.push(999);
        }
      }

      depthMatrix.push(rDepth);
      surfaceMatrix.push(rSurf);
      velMatrix.push(rVel);
      dirMatrix.push(rDir);
      inundationMask.push(rInund);
      arrivalTimeMatrix.push(rArrival);
    }

    const floodedArea = Math.round((floodedCells * 0.085) * 10) / 10;
    const affectedAssets = maxDepth > 30 ? 7 : maxDepth > 15 ? 5 : maxDepth > 5 ? 3 : 1;

    // Time display hh:mm:ss
    const totalSec = Math.floor(timeMin * 60);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const timeDisplay = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return {
      timeSec: totalSec,
      timeDisplay,
      progressPercent: Math.round(progress * 100),
      waterDepthMatrix: depthMatrix,
      waterSurfaceElevationMatrix: surfaceMatrix,
      velocityMatrix: velMatrix,
      flowDirectionMatrix: dirMatrix,
      inundationMask,
      arrivalTimeMatrix,
      floodedAreaKm2: floodedArea,
      maxDepthM: maxDepth,
      maxVelocityMs: maxVel,
      peakDischargeM3s: Math.round(peakQ),
      affectedAssetsCount: affectedAssets,
      breachProgressPercent: Math.round(breachProgress * 100)
    };
  }
}
