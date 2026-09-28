"""
backend/test_phase25_hydraulic_quality.py

Phase 25 — Hydraulic Quality Control Automated Test Suite.

Verifies:
1. Frame-by-frame physical consistency audit (10 rules).
2. Quantitative metrics calculation (max depth, mean depth, max velocity, flood area, wet cells, water volume, inflow, outflow, mass balance).
3. Hydraulic Diagnostics Panel payload structure.
4. Warning state classification (NORMAL, WARNING, CRITICAL) against documented thresholds.
"""

import unittest
import numpy as np

from app.simulation.hydrodynamic_2d_solver import Hydrodynamic2DSolver, Hydrodynamic2DSolverConfig, SolverMode
from app.simulation.hydraulic_qc_service import HydraulicQualityControlService, QCWarningState


class TestPhase25HydraulicQuality(unittest.TestCase):

    def setUp(self):
        # Create realistic DEM valley grid
        self.rows, self.cols = 30, 30
        self.dem_grid = np.ones((self.rows, self.cols), dtype=np.float64) * 750.0
        for r in range(self.rows):
            for c in range(self.cols):
                s = (r + c) / 2.0
                d = abs(r - c)
                z_river = max(340.0, 600.0 - s * 9.0)
                self.dem_grid[r, c] = z_river + (d ** 2) * 12.5

        self.config = Hydrodynamic2DSolverConfig(
            dem_matrix=self.dem_grid,
            mode=SolverMode.SWE,
            dam_location=(2, 2),
            breach_width_m=180.0,
            reservoir_level_m=830.0,
            simulation_duration_sec=60.0
        )
        self.solver = Hydrodynamic2DSolver(config=self.config)
        self.simulation_result = self.solver.run_simulation()
        self.qc_service = HydraulicQualityControlService()

    def test_01_frame_by_frame_qc_checks(self):
        """Audit every frame for 10 physical consistency rules."""
        frames = self.simulation_result["frames"]
        self.assertGreater(len(frames), 0)

        for frame in frames:
            audit = self.qc_service.audit_simulation_frame(frame, dem_matrix=self.dem_grid)
            self.assertTrue(audit["frame_passed"])
            checks = audit["checks"]
            self.assertTrue(checks["depth_non_negative"])
            self.assertTrue(checks["velocity_finite"])
            self.assertTrue(checks["wse_finite"])
            self.assertTrue(checks["wse_consistent"])
            self.assertTrue(checks["no_nan"])
            self.assertTrue(checks["no_inf"])
            self.assertTrue(checks["flooded_mask_valid"])
            self.assertTrue(checks["terrain_overtopping_valid"])

    def test_02_quantitative_metrics(self):
        """Verify calculation of 9 quantitative hydraulic metrics."""
        audit_res = self.qc_service.audit_full_simulation(self.simulation_result, dem_matrix=self.dem_grid)
        self.assertEqual(audit_res["audit_status"], "SUCCESS")
        
        panel = audit_res["diagnostics_panel"]
        self.assertGreaterEqual(panel["max_depth_m"], 0.0)
        self.assertGreaterEqual(panel["max_velocity_ms"], 0.0)
        self.assertGreaterEqual(panel["flood_area_km2"], 0.0)
        self.assertGreaterEqual(panel["wet_cells"], 0)
        self.assertGreaterEqual(panel["water_volume_m3"], 0.0)
        self.assertLessEqual(panel["mass_balance_error_percent"], 0.05)

    def test_03_warning_states_classification(self):
        """Verify NORMAL, WARNING, and CRITICAL state triggers based on documented thresholds."""
        audit_normal = self.qc_service.audit_full_simulation(self.simulation_result, dem_matrix=self.dem_grid)
        self.assertEqual(audit_normal["warning_state"], QCWarningState.NORMAL.value)

        # Simulated WARNING state (mass balance error = 0.12%)
        sim_warning = dict(self.simulation_result)
        sim_warning["display_metrics"] = dict(sim_warning["display_metrics"])
        sim_warning["display_metrics"]["mass_balance_error_percent"] = 0.12
        audit_warn = self.qc_service.audit_full_simulation(sim_warning, dem_matrix=self.dem_grid)
        self.assertEqual(audit_warn["warning_state"], QCWarningState.WARNING.value)

        # Simulated CRITICAL state (mass balance error = 0.35%)
        sim_crit = dict(self.simulation_result)
        sim_crit["display_metrics"] = dict(sim_crit["display_metrics"])
        sim_crit["display_metrics"]["mass_balance_error_percent"] = 0.35
        audit_crit = self.qc_service.audit_full_simulation(sim_crit, dem_matrix=self.dem_grid)
        self.assertEqual(audit_crit["warning_state"], QCWarningState.CRITICAL.value)

    def test_04_hydraulic_diagnostics_panel_payload(self):
        """Verify Hydraulic Diagnostics Panel contains all required keys."""
        audit_res = self.qc_service.audit_full_simulation(self.simulation_result, dem_matrix=self.dem_grid)
        panel = audit_res["diagnostics_panel"]

        required_keys = [
            "model", "scenario", "time_display", "cfl", "timestep_sec",
            "max_depth_m", "max_velocity_ms", "flood_area_km2", "wet_cells",
            "water_volume_m3", "mass_balance_error_percent", "warning_state", "warning_reason"
        ]
        for key in required_keys:
            self.assertIn(key, panel, f"Missing key '{key}' in diagnostics panel payload.")


if __name__ == "__main__":
    unittest.main()
