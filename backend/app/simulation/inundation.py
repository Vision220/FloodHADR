"""
inundation.py - Inundation Metrics, Masks, and Envelope Tracking

===============================================================================
SCIENTIFIC & MODELING ASSUMPTIONS:
1. A cell is classified as "flooded" when water depth H >= min_inundation_threshold (e.g. 0.05m).
2. Flood arrival time T_arr is recorded at the first time step when cell depth crosses the threshold.
3. Total inundation area represents the spatial union of all cells flooded at any point during simulation.
===============================================================================
"""

from typing import Dict, Any, Tuple
import numpy as np
from app.simulation.grid import DEMGrid


class InundationTracker:
    """
    Tracks dynamic and cumulative flood inundation statistics across timesteps.
    """

    def __init__(self, grid: DEMGrid, min_inundation_threshold: float = 0.05):
        """
        Parameters:
        -----------
        grid : DEMGrid
            Raster grid object.
        min_inundation_threshold : float
            Depth threshold in meters to classify cell as flooded. Default 0.05m.
        """
        self.grid = grid
        self.h_threshold = float(min_inundation_threshold)
        shape = (grid.rows, grid.cols)

        # Cumulative metric rasters
        self.max_depth_grid = np.zeros(shape, dtype=np.float64)
        self.max_velocity_grid = np.zeros(shape, dtype=np.float64)
        self.arrival_time_grid = np.full(shape, -1.0, dtype=np.float64)  # -1 means never flooded
        self.duration_grid = np.zeros(shape, dtype=np.float64)

    def update_step(self, depth_grid: np.ndarray, velocity_grid: np.ndarray, t: float, dt: float) -> np.ndarray:
        """
        Update dynamic tracker state at time step t.

        Parameters:
        -----------
        depth_grid : np.ndarray
            Current water depth grid (m).
        velocity_grid : np.ndarray
            Current velocity speed grid (m/s).
        t : float
            Current simulation time in seconds.
        dt : float
            Time step duration in seconds.

        Returns:
        --------
        flooded_mask : np.ndarray
            Boolean mask of currently flooded cells (H >= h_threshold).
        """
        flooded_mask = depth_grid >= self.h_threshold

        # Update maximum depth envelope
        self.max_depth_grid = np.maximum(self.max_depth_grid, depth_grid)

        # Update maximum velocity envelope
        self.max_velocity_grid = np.maximum(self.max_velocity_grid, velocity_grid)

        # Record first arrival time (only update cells flooded for the first time)
        newly_flooded = flooded_mask & (self.arrival_time_grid < 0.0)
        self.arrival_time_grid[newly_flooded] = t

        # Accumulate flood duration
        self.duration_grid[flooded_mask] += dt

        return flooded_mask

    def get_summary_metrics(self) -> Dict[str, Any]:
        """
        Calculate scalar summary metrics for the simulation run.
        """
        flooded_anytime = self.max_depth_grid >= self.h_threshold
        flooded_cell_count = int(np.sum(flooded_anytime))
        max_inundation_area_m2 = flooded_cell_count * self.grid.cell_area
        max_inundation_area_km2 = max_inundation_area_m2 / 1e6

        max_depth = float(np.max(self.max_depth_grid))
        max_velocity = float(np.max(self.max_velocity_grid))

        # Earliest arrival time among flooded cells
        valid_arrivals = self.arrival_time_grid[self.arrival_time_grid >= 0.0]
        earliest_arrival = float(np.min(valid_arrivals)) if len(valid_arrivals) > 0 else 0.0
        max_duration = float(np.max(self.duration_grid))

        return {
            "max_flood_depth_m": round(max_depth, 2),
            "max_velocity_ms": round(max_velocity, 2),
            "max_inundation_area_m2": round(max_inundation_area_m2, 1),
            "max_inundation_area_km2": round(max_inundation_area_km2, 4),
            "flooded_cell_count": flooded_cell_count,
            "earliest_arrival_time_sec": round(earliest_arrival, 1),
            "max_flood_duration_sec": round(max_duration, 1),
        }
