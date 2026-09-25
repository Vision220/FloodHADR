"""
initial_conditions.py - Initial Hydraulic State & Reservoir Delineation

===============================================================================
SCIENTIFIC & MODELING ASSUMPTIONS:
1. Reservoir impoundment is modeled as a standing body of water upstream of the dam.
2. Initial water surface elevation in the reservoir is assumed horizontal up to
   the specified initial reservoir water depth or dam crest level.
3. Downstream channel terrain is assumed dry (zero initial depth) or at baseflow level.
===============================================================================
"""

from typing import Tuple, Optional, List
import numpy as np
from app.simulation.grid import DEMGrid


class InitialConditions:
    """
    Sets up initial hydrodynamic state variables across the DEM grid.
    """

    def __init__(self, grid: DEMGrid):
        self.grid = grid
        self.depth_grid = np.zeros((grid.rows, grid.cols), dtype=np.float64)
        self.wse_grid = np.copy(grid.dem)

    def initialize_reservoir(
        self,
        dam_location: Tuple[int, int],
        initial_reservoir_depth: float,
        reservoir_bounds: Optional[Tuple[int, int, int, int]] = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Delineate and set initial reservoir water depth behind dam location.

        Parameters:
        -----------
        dam_location : Tuple[int, int]
            (dam_row, dam_col) coordinate of the dam breach point.
        initial_reservoir_depth : float
            Depth of water in meters stored behind the dam.
        reservoir_bounds : Optional[Tuple[min_row, max_row, min_col, max_col]]
            Bounding box restricting reservoir area. If None, automatically inferred
            upstream of dam based on elevation.

        Returns:
        --------
        depth_grid : np.ndarray
            Initial water depth grid in meters.
        wse_grid : np.ndarray
            Initial water surface elevation grid (Z + depth) in meters.
        """
        dam_r, dam_c = dam_location
        if not self.grid.is_valid_cell(dam_r, dam_c):
            raise ValueError(f"Dam location {dam_location} is outside grid boundaries.")

        dam_z = self.grid.dem[dam_r, dam_c]
        target_wse = dam_z + initial_reservoir_depth

        if reservoir_bounds:
            r_min, r_max, c_min, c_max = reservoir_bounds
        else:
            # Default heuristic: bounding box upstream (rows <= dam_r or cols around dam)
            r_min, r_max = 0, min(self.grid.rows, dam_r + 2)
            c_min, c_max = 0, self.grid.cols

        # Fill reservoir area where terrain elevation Z is below target WSE
        for r in range(r_min, r_max):
            for c in range(c_min, c_max):
                if self.grid.dem[r, c] < target_wse:
                    # Avoid filling downstream cells past the dam row if dam is horizontal wall
                    if r <= dam_r:
                        depth = target_wse - self.grid.dem[r, c]
                        self.depth_grid[r, c] = max(0.0, depth)

        self.wse_grid = self.grid.dem + self.depth_grid
        return self.depth_grid, self.wse_grid
