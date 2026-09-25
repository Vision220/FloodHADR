"""
water_propagation.py - 2D Raster Diffusive Wave Water Propagation Solver

===============================================================================
SCIENTIFIC & MODELING ASSUMPTIONS:
1. Flood propagation is modeled using a simplified 2D Diffusive Wave approximation.
2. Inter-cell volumetric flow rate Q_ij is driven by water surface elevation (WSE) gradient
   S_ij = (wse_i - wse_j) / dist and resisted by Manning roughness n.
3. Manning's equation unit width discharge: q = (1/n) * R^(5/3) * S^(1/2).
4. Unconditional numerical stability is guaranteed via a head-gradient flux limiter
   that prevents overshooting WSE equilibrium or creating negative depths.
===============================================================================
"""

from typing import Tuple
import numpy as np
from app.simulation.grid import DEMGrid


class WaterPropagationSolver:
    """
    Computes 2D raster water propagation and cell depth updates across time steps.
    """

    def __init__(self, grid: DEMGrid, manning_n: float = 0.035, min_depth_threshold: float = 0.001):
        """
        Parameters:
        -----------
        grid : DEMGrid
            Raster elevation grid object.
        manning_n : float
            Manning's roughness coefficient (s / m^(1/3)). Default 0.035.
        min_depth_threshold : float
            Minimum water depth in meters below which cell is treated as dry.
        """
        self.grid = grid
        self.n = max(0.001, float(manning_n))
        self.h_min = float(min_depth_threshold)

    def step_propagation(
        self,
        depth_grid: np.ndarray,
        wse_grid: np.ndarray,
        dt: float
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Perform one explicit numerical time step update of water depth and surface elevation.
        """
        rows, cols = self.grid.rows, self.grid.cols
        dem = self.grid.dem
        dx, dy = self.grid.dx, self.grid.dy
        cell_area = self.grid.cell_area

        # Ensure input depths are valid and non-negative
        h = np.nan_to_num(np.maximum(0.0, depth_grid), nan=0.0, posinf=0.0, neginf=0.0)
        wse = dem + h

        net_volume_change = np.zeros((rows, cols), dtype=np.float64)
        qx = np.zeros((rows, cols), dtype=np.float64)
        qy = np.zeros((rows, cols), dtype=np.float64)

        # ---------------------------------------------------------------------
        # 1. Horizontal flow (X-axis, columns)
        # ---------------------------------------------------------------------
        wse_west, wse_east = wse[:, :-1], wse[:, 1:]
        dem_west, dem_east = dem[:, :-1], dem[:, 1:]
        h_west, h_east = h[:, :-1], h[:, 1:]

        dh_x = wse_west - wse_east  # positive = flow West->East
        slope_x = np.abs(dh_x) / dx

        # Hydraulic flow depth over barrier
        max_z_x = np.maximum(dem_west, dem_east)
        min_wse_x = np.minimum(wse_west, wse_east)
        h_flow_x = np.maximum(0.0, min_wse_x - max_z_x)
        h_avg_x = np.maximum(h_flow_x, 0.5 * (h_west + h_east))
        h_avg_x = np.minimum(50.0, h_avg_x)  # Cap depth for numerical safety

        # Manning discharge magnitude: q = (1/n) * R^(5/3) * S^(1/2)
        q_mag_x = (1.0 / self.n) * np.power(np.maximum(0.0, h_avg_x), 5.0 / 3.0) * np.sqrt(np.maximum(1e-6, slope_x))
        active_x = (slope_x > 1e-4) & ((h_west > self.h_min) | (h_east > self.h_min)) & (h_avg_x > self.h_min)
        q_mag_x = np.where(active_x, q_mag_x, 0.0)

        # Raw volume transfer over dt
        vol_x_raw = q_mag_x * dy * dt

        # Stable volume transfer cap: max 25% of WSE difference * area, and max 25% of source depth * area
        max_vol_equalize_x = 0.25 * np.abs(dh_x) * cell_area
        source_h_x = np.where(dh_x > 0, h_west, h_east)
        max_vol_source_x = 0.25 * source_h_x * cell_area

        vol_x_capped = np.minimum(vol_x_raw, np.minimum(max_vol_equalize_x, max_vol_source_x))
        vol_x = np.sign(dh_x) * vol_x_capped

        # Net volume accumulation
        net_volume_change[:, :-1] -= vol_x
        net_volume_change[:, 1:] += vol_x

        # Calculate interface discharge (m^2/s)
        q_interface_x = np.where(dt > 0, vol_x / (dy * dt), 0.0)
        qx[:, :-1] += 0.5 * q_interface_x
        qx[:, 1:] += 0.5 * q_interface_x

        # ---------------------------------------------------------------------
        # 2. Vertical flow (Y-axis, rows)
        # ---------------------------------------------------------------------
        wse_north, wse_south = wse[:-1, :], wse[1:, :]
        dem_north, dem_south = dem[:-1, :], dem[1:, :]
        h_north, h_south = h[:-1, :], h[1:, :]

        dh_y = wse_north - wse_south  # positive = flow North->South
        slope_y = np.abs(dh_y) / dy

        max_z_y = np.maximum(dem_north, dem_south)
        min_wse_y = np.minimum(wse_north, wse_south)
        h_flow_y = np.maximum(0.0, min_wse_y - max_z_y)
        h_avg_y = np.maximum(h_flow_y, 0.5 * (h_north + h_south))
        h_avg_y = np.minimum(50.0, h_avg_y)

        q_mag_y = (1.0 / self.n) * np.power(np.maximum(0.0, h_avg_y), 5.0 / 3.0) * np.sqrt(np.maximum(1e-6, slope_y))
        active_y = (slope_y > 1e-4) & ((h_north > self.h_min) | (h_south > self.h_min)) & (h_avg_y > self.h_min)
        q_mag_y = np.where(active_y, q_mag_y, 0.0)

        vol_y_raw = q_mag_y * dx * dt

        max_vol_equalize_y = 0.25 * np.abs(dh_y) * cell_area
        source_h_y = np.where(dh_y > 0, h_north, h_south)
        max_vol_source_y = 0.25 * source_h_y * cell_area

        vol_y_capped = np.minimum(vol_y_raw, np.minimum(max_vol_equalize_y, max_vol_source_y))
        vol_y = np.sign(dh_y) * vol_y_capped

        net_volume_change[:-1, :] -= vol_y
        net_volume_change[1:, :] += vol_y

        q_interface_y = np.where(dt > 0, vol_y / (dx * dt), 0.0)
        qy[:-1, :] += 0.5 * q_interface_y
        qy[1:, :] += 0.5 * q_interface_y

        # Safety bound on net depth reduction
        max_allowed_loss = -0.9 * h * cell_area
        net_volume_change = np.maximum(net_volume_change, max_allowed_loss)

        # Update depth and surface elevation
        new_depth = np.maximum(0.0, h + net_volume_change / cell_area)
        new_wse = dem + new_depth

        return new_depth, new_wse, qx, qy
