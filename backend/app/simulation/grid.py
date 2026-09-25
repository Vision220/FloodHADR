"""
grid.py - Digital Elevation Model (DEM) Grid Representation

===============================================================================
SCIENTIFIC & MODELING ASSUMPTIONS:
1. Terrain is discretized into a regular 2D rectangular raster grid.
2. Elevation Z(y, x) is assumed spatially constant across the cell area (dx * dy).
3. Earth curvature and map projection distortions are ignored for regional scale grids.
===============================================================================
"""

from typing import Tuple, List
import numpy as np


class DEMGrid:
    """
    Encapsulates spatial raster grid elevation data and topological querying.
    """

    def __init__(self, dem_matrix: np.ndarray, dx: float = 10.0, dy: float = 10.0):
        """
        Initialize the DEM grid.

        Parameters:
        -----------
        dem_matrix : np.ndarray
            2D numpy array of surface elevations in meters.
        dx : float
            Cell width along the X-axis (columns) in meters.
        dy : float
            Cell height along the Y-axis (rows) in meters.
        """
        if dem_matrix.ndim != 2:
            raise ValueError("DEM matrix must be a 2D NumPy array.")
        
        self.dem = np.array(dem_matrix, dtype=np.float64)
        self.rows, self.cols = self.dem.shape
        self.dx = float(dx)
        self.dy = float(dy)
        self.cell_area = self.dx * self.dy

    def is_valid_cell(self, row: int, col: int) -> bool:
        """Check if grid coordinates fall within raster boundaries."""
        return 0 <= row < self.rows and 0 <= col < self.cols

    def get_elevation(self, row: int, col: int) -> float:
        """Return elevation Z at specific grid cell."""
        return float(self.dem[row, col])

    def compute_slopes(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Compute surface elevation gradients dZ/dx, dZ/dy, and slope magnitude.

        Returns:
        --------
        dz_dx : np.ndarray
            Gradient along x direction (columns).
        dz_dy : np.ndarray
            Gradient along y direction (rows).
        slope_mag : np.ndarray
            Overall slope magnitude sqrt((dz/dx)^2 + (dz/dy)^2).
        """
        dz_dy, dz_dx = np.gradient(self.dem, self.dy, self.dx)
        slope_mag = np.sqrt(dz_dx**2 + dz_dy**2)
        return dz_dx, dz_dy, slope_mag

    def get_4_neighbors(self, row: int, col: int) -> List[Tuple[int, int, float]]:
        """
        Get 4-connected orthogonal neighboring cell indices and distance.

        Returns:
        --------
        List of (neighbor_row, neighbor_col, distance_meters)
        """
        neighbors = []
        # North, South, East, West
        offsets = [(-1, 0, self.dy), (1, 0, self.dy), (0, 1, self.dx), (0, -1, self.dx)]
        for dr, dc, dist in offsets:
            r, c = row + dr, col + dc
            if self.is_valid_cell(r, c):
                neighbors.append((r, c, dist))
        return neighbors
