"""
velocity.py - Hydrodynamic Flow Velocity Field Estimation

===============================================================================
SCIENTIFIC & MODELING ASSUMPTIONS:
1. Flow velocity vectors (u, v) and overall speed magnitude V = sqrt(u^2 + v^2) are
   estimated from local water surface elevation gradients and Manning's roughness.
2. For shallow water depth below min_depth_threshold, velocity is set to 0.0 m/s
   to reflect dominant boundary layer skin friction.
===============================================================================
"""

from typing import Tuple
import numpy as np
from app.simulation.grid import DEMGrid


class VelocityEstimator:
    """
    Estimates 2D flow velocity vectors and magnitude grids.
    """

    def __init__(self, grid: DEMGrid, manning_n: float = 0.035, min_depth_threshold: float = 0.001):
        self.grid = grid
        self.n = max(0.001, float(manning_n))
        self.h_min = float(min_depth_threshold)

    def estimate_velocity(
        self,
        depth_grid: np.ndarray,
        wse_grid: np.ndarray,
        qx_grid: np.ndarray = None,
        qy_grid: np.ndarray = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Compute velocity magnitude V, u-component (eastward), and v-component (northward).

        Parameters:
        -----------
        depth_grid : np.ndarray
            Water depth grid in meters.
        wse_grid : np.ndarray
            Water surface elevation grid in meters.
        qx_grid : Optional[np.ndarray]
            Unit discharge X component (m^2/s).
        qy_grid : Optional[np.ndarray]
            Unit discharge Y component (m^2/s).

        Returns:
        --------
        velocity_mag : np.ndarray
            Flow velocity speed matrix in m/s.
        u_grid : np.ndarray
            X velocity component matrix in m/s.
        v_grid : np.ndarray
            Y velocity component matrix in m/s.
        """
        rows, cols = self.grid.rows, self.grid.cols
        h = np.maximum(0.0, depth_grid)

        if qx_grid is not None and qy_grid is not None:
            # Velocity from discharge: V = q / h
            safe_h = np.maximum(self.h_min, h)
            u = np.where(h > self.h_min, qx_grid / safe_h, 0.0)
            v = np.where(h > self.h_min, qy_grid / safe_h, 0.0)
            vel_mag = np.sqrt(u**2 + v**2)
        else:
            # Velocity from Manning equation: V = (1/n) * H^(2/3) * S^(1/2)
            dwse_dy, dwse_dx = np.gradient(wse_grid, self.grid.dy, self.grid.dx)
            slope = np.sqrt(dwse_dx**2 + dwse_dy**2)
            
            vel_mag = (1.0 / self.n) * np.power(h, 2.0 / 3.0) * np.sqrt(slope)
            # Component directions oppose the gradient (flow moves down water surface)
            norm = np.maximum(1e-6, slope)
            u = -vel_mag * (dwse_dx / norm)
            v = -vel_mag * (dwse_dy / norm)

        # Zero out dry cells
        wet_mask = h > self.h_min
        vel_mag = np.where(wet_mask, vel_mag, 0.0)
        u = np.where(wet_mask, u, 0.0)
        v = np.where(wet_mask, v, 0.0)

        # Physical safety cap (e.g. 25 m/s maximum realistic flash flood speed)
        vel_mag = np.minimum(25.0, vel_mag)

        return vel_mag, u, v
