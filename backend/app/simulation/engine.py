"""
engine.py - Modular 2D Hydrodynamic Flood Simulation Engine

===============================================================================
SCIENTIFIC & MODELING DISCLAIMER:
-------------------------------------------------------------------------------
This software module implements a simplified, 2D raster-based shallow-water-style
and diffusive-wave hydrodynamic flood propagation engine developed as a working
prototype demonstrator for the SIH (Smart India Hackathon) concept.

IT IS NOT A RESEARCH-GRADE OR REGULATORY REPLACEMENT FOR FULLY VALIDATED
HYDRODYNAMIC MODELING SYSTEMS (SUCH AS DELFT3D, HEC-RAS 2D, TELEMAC, OR DUALSPHYSICS).

Key Simplifications & Limitations:
1. Approximates 2D Saint-Venant shallow water equations by omitting non-linear
   advective and dynamic acceleration terms.
2. Uses Manning's friction equation to govern inter-cell fluxes.
3. Does not calculate complex 3D turbulence, secondary wave reflections, or dynamic
   sediment erosion/transport.
4. Intended for rapid disaster screening, emergency preparedness, and decision support.
===============================================================================
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

from app.simulation.grid import DEMGrid
from app.simulation.initial_conditions import InitialConditions
from app.simulation.dam_break import DamBreachModel
from app.simulation.water_propagation import WaterPropagationSolver
from app.simulation.velocity import VelocityEstimator
from app.simulation.inundation import InundationTracker


@dataclass
class SimulationConfig:
    """
    Configuration parameters for a flood simulation run.
    """
    dem_matrix: np.ndarray
    dam_location: Tuple[int, int]
    breach_width: float  # meters
    breach_formation_time: float  # seconds
    initial_reservoir_water_depth: float  # meters
    dx: float = 10.0  # cell width (m)
    dy: float = 10.0  # cell height (m)
    initial_water_level: float = 0.0  # ambient baseflow level (m)
    manning_roughness: float = 0.035  # Manning's n (s / m^1/3)
    simulation_duration: float = 3600.0  # total runtime (s)
    time_step: float = 10.0  # dt step (s)
    min_inundation_threshold: float = 0.05  # depth threshold for flooded mask (m)


@dataclass
class SimulationStepOutput:
    """
    Output data captured for a single simulation time step.
    """
    step_index: int
    time_sec: float
    water_depth: np.ndarray
    water_surface_elevation: np.ndarray
    approximate_velocity: np.ndarray
    flooded_mask: np.ndarray


@dataclass
class SimulationResult:
    """
    Complete output container for a flood simulation run.
    """
    # Time-series outputs
    time_steps: List[float]
    step_outputs: List[SimulationStepOutput]

    # Summary rasters
    max_flood_depth: np.ndarray
    max_velocity: np.ndarray
    flood_arrival_time: np.ndarray
    flood_duration: np.ndarray
    final_inundation_mask: np.ndarray

    # Summary scalar metrics
    maximum_flood_depth: float
    maximum_velocity: float
    maximum_inundation_area: float  # in square meters
    maximum_inundation_area_km2: float  # in square kilometers

    # Disclaimer
    disclaimer: str = (
        "PROTOTYPE DEMONSTRATOR ONLY: Simplified 2D raster flood propagation model. "
        "Not a validated replacement for Delft3D or HEC-RAS 2D."
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert scalar summary results to python dictionary for API consumption."""
        return {
            "disclaimer": self.disclaimer,
            "maximum_flood_depth_m": self.maximum_flood_depth,
            "maximum_velocity_ms": self.maximum_velocity,
            "maximum_inundation_area_m2": self.maximum_inundation_area,
            "maximum_inundation_area_km2": self.maximum_inundation_area_km2,
            "total_time_steps": len(self.time_steps),
            "final_simulation_time_sec": self.time_steps[-1] if self.time_steps else 0.0,
        }


class FloodSimulationEngine:
    """
    Main orchestrator for the 11-step 2D raster flood simulation algorithm.
    """

    def __init__(self, config: SimulationConfig):
        self.config = config

    def run(self, snapshot_interval_steps: int = 1) -> SimulationResult:
        """
        Execute the 11-step 2D hydrodynamic simulation loop.

        Parameters:
        -----------
        snapshot_interval_steps : int
            Interval of steps at which per-step rasters are stored in step_outputs.

        Returns:
        --------
        result : SimulationResult
            Populated SimulationResult object.
        """
        cfg = self.config

        # ---------------------------------------------------------------------
        # 1. Initialize terrain from DEM
        # ---------------------------------------------------------------------
        grid = DEMGrid(cfg.dem_matrix, dx=cfg.dx, dy=cfg.dy)

        # ---------------------------------------------------------------------
        # 2. Define the dam/reservoir area
        # ---------------------------------------------------------------------
        ic = InitialConditions(grid)
        depth_grid, wse_grid = ic.initialize_reservoir(
            dam_location=cfg.dam_location,
            initial_reservoir_depth=cfg.initial_reservoir_water_depth
        )

        # Add initial ambient baseflow if set
        if cfg.initial_water_level > 0:
            depth_grid = np.maximum(depth_grid, cfg.initial_water_level)
            wse_grid = grid.dem + depth_grid

        # ---------------------------------------------------------------------
        # 3. Create the breach model
        # ---------------------------------------------------------------------
        dam_r, dam_c = cfg.dam_location
        original_dam_z = float(grid.dem[dam_r, dam_c])
        breach_invert_z = original_dam_z - cfg.initial_reservoir_water_depth

        breach_model = DamBreachModel(
            dam_location=cfg.dam_location,
            breach_width=cfg.breach_width,
            breach_formation_time=cfg.breach_formation_time,
            initial_reservoir_depth=cfg.initial_reservoir_water_depth
        )

        # Initialize sub-solvers
        propagation_solver = WaterPropagationSolver(
            grid,
            manning_n=cfg.manning_roughness,
            min_depth_threshold=cfg.min_inundation_threshold
        )
        velocity_estimator = VelocityEstimator(
            grid,
            manning_n=cfg.manning_roughness,
            min_depth_threshold=cfg.min_inundation_threshold
        )
        inundation_tracker = InundationTracker(
            grid,
            min_inundation_threshold=cfg.min_inundation_threshold
        )

        total_steps = max(1, int(cfg.simulation_duration / cfg.time_step))
        dt = cfg.time_step

        time_steps: List[float] = []
        step_outputs: List[SimulationStepOutput] = []

        for step in range(total_steps):
            current_t = step * dt
            time_steps.append(current_t)

            # -----------------------------------------------------------------
            # 4. Release water through breach & update breach terrain
            # -----------------------------------------------------------------
            breach_model.update_breach_elevation(
                grid.dem, current_t, original_dam_z, breach_invert_z
            )
            
            # Upstream reservoir depth behind dam
            upstream_r = max(0, dam_r - 1)
            res_depth = float(depth_grid[upstream_r, dam_c])

            q_release = breach_model.compute_breach_discharge(current_t, res_depth)
            
            # Physical volume safety cap: cannot release more water than upstream depth * area
            max_dt_volume = 0.5 * res_depth * grid.cell_area
            vol_released = min(q_release * dt, max_dt_volume)

            # Transfer water volume from upstream reservoir cell to dam breach cell
            if vol_released > 0 and res_depth > 0:
                delta_h = vol_released / grid.cell_area
                depth_grid[upstream_r, dam_c] = max(0.0, depth_grid[upstream_r, dam_c] - delta_h)
                depth_grid[dam_r, dam_c] += delta_h
                wse_grid[upstream_r, dam_c] = grid.dem[upstream_r, dam_c] + depth_grid[upstream_r, dam_c]
                wse_grid[dam_r, dam_c] = grid.dem[dam_r, dam_c] + depth_grid[dam_r, dam_c]

            # -----------------------------------------------------------------
            # 5 & 6. Propagate water toward lower terrain & Update water depth
            # -----------------------------------------------------------------
            depth_grid, wse_grid, qx, qy = propagation_solver.step_propagation(
                depth_grid, wse_grid, dt
            )

            # -----------------------------------------------------------------
            # 7. Estimate velocity
            # -----------------------------------------------------------------
            vel_mag, u, v = velocity_estimator.estimate_velocity(
                depth_grid, wse_grid, qx, qy
            )

            # -----------------------------------------------------------------
            # 8, 9 & 10. Track maximum depth, velocity, and first-arrival time
            # -----------------------------------------------------------------
            flooded_mask = inundation_tracker.update_step(
                depth_grid, vel_mag, current_t, dt
            )

            # Capture step snapshot
            if step % snapshot_interval_steps == 0 or step == total_steps - 1:
                step_out = SimulationStepOutput(
                    step_index=step,
                    time_sec=current_t,
                    water_depth=np.copy(depth_grid),
                    water_surface_elevation=np.copy(wse_grid),
                    approximate_velocity=np.copy(vel_mag),
                    flooded_mask=np.copy(flooded_mask)
                )
                step_outputs.append(step_out)

        # ---------------------------------------------------------------------
        # 11. Generate final inundation mask & summary metrics
        # ---------------------------------------------------------------------
        metrics = inundation_tracker.get_summary_metrics()

        result = SimulationResult(
            time_steps=time_steps,
            step_outputs=step_outputs,
            max_flood_depth=inundation_tracker.max_depth_grid,
            max_velocity=inundation_tracker.max_velocity_grid,
            flood_arrival_time=inundation_tracker.arrival_time_grid,
            flood_duration=inundation_tracker.duration_grid,
            final_inundation_mask=(inundation_tracker.max_depth_grid >= cfg.min_inundation_threshold),
            maximum_flood_depth=metrics["max_flood_depth_m"],
            maximum_velocity=metrics["max_velocity_ms"],
            maximum_inundation_area=metrics["max_inundation_area_m2"],
            maximum_inundation_area_km2=metrics["max_inundation_area_km2"]
        )

        return result
