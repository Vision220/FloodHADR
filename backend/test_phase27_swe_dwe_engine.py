import unittest
import numpy as np

from app.simulation.hydrodynamic_2d_solver import Hydrodynamic2DSolver, Hydrodynamic2DSolverConfig, SolverMode

class TestPhase27SWEDWEEngine(unittest.TestCase):
    """Automated test suite for Phase 27 — Real FloodHADR SWE/DWE Computation Engine."""

    def setUp(self):
        # 30x30 DEM grid representing valley topography
        self.rows, self.cols = 30, 30
        self.dem_matrix = np.ones((self.rows, self.cols), dtype=np.float64) * 750.0
        for r in range(self.rows):
            for c in range(self.cols):
                s = (r + c) / 2.0
                d = abs(r - c)
                z_river = max(340.0, 600.0 - s * 9.0)
                self.dem_matrix[r, c] = z_river + (d ** 2) * 12.5

        # SWE Config
        self.swe_config = Hydrodynamic2DSolverConfig(
            dem_matrix=self.dem_matrix,
            mode=SolverMode.SWE,
            dam_location=(2, 2),
            breach_width_m=180.0,
            reservoir_level_m=830.0,
            simulation_duration_sec=60.0
        )
        self.swe_solver = Hydrodynamic2DSolver(self.swe_config)
        self.swe_results = self.swe_solver.run_simulation()

        # DWE Config
        self.dwe_config = Hydrodynamic2DSolverConfig(
            dem_matrix=self.dem_matrix,
            mode=SolverMode.DWE,
            dam_location=(2, 2),
            breach_width_m=180.0,
            reservoir_level_m=830.0,
            simulation_duration_sec=60.0
        )
        self.dwe_solver = Hydrodynamic2DSolver(self.dwe_config)
        self.dwe_results = self.dwe_solver.run_simulation()

    def test_01_swe_vs_dwe_formulation(self):
        """Verify SWE and DWE produce distinct physical output datasets."""
        self.assertEqual(self.swe_results["solver_mode"], "FloodHADR SWE")
        self.assertEqual(self.dwe_results["solver_mode"], "FloodHADR DWE")
        self.assertEqual(self.swe_results["provenance"], "SIMULATED_2D_SWE")
        self.assertEqual(self.dwe_results["provenance"], "SIMULATED_2D_DWE")

        # Depth and velocity outputs should differ due to momentum term inclusions in SWE
        swe_max_d = self.swe_results["summary_scalar_metrics"]["maximum_depth_m"]
        dwe_max_d = self.dwe_results["summary_scalar_metrics"]["maximum_depth_m"]
        self.assertNotEqual(swe_max_d, dwe_max_d)

    def test_02_required_output_payloads(self):
        """Verify all 11 required output fields exist in frames and summary rasters."""
        frames = self.swe_results["frames"]
        self.assertGreater(len(frames), 0)
        f0 = frames[-1]

        # 11 Required Fields per frame
        self.assertIn("time_sec", f0)
        self.assertIn("water_depth", f0)
        self.assertIn("velocity_x", f0)
        self.assertIn("velocity_y", f0)
        self.assertIn("velocity", f0) # magnitude
        self.assertIn("water_surface_elevation", f0)
        self.assertIn("flooded_mask", f0) # wet_mask
        self.assertIn("flooded_area_km2", f0)
        self.assertIn("timestep_sec", f0)

        # Summary rasters check
        summary = self.swe_results["summary_rasters"]
        self.assertIn("max_depth_m", summary)
        self.assertIn("max_velocity_ms", summary)
        self.assertIn("velocity_x", summary)
        self.assertIn("velocity_y", summary)
        self.assertIn("arrival_time_sec", summary)
        self.assertIn("flood_duration_sec", summary)
        self.assertIn("flow_direction_deg", summary)
        self.assertIn("final_flood_extent_mask", summary)

        # Virtual Gauge Hydrographs
        gauges = self.swe_results["virtual_gauge_hydrographs"]
        self.assertIn("vg-01", gauges)
        self.assertIn("vg-02", gauges)
        self.assertIn("vg-03", gauges)
        self.assertIn("vg-04", gauges)

    def test_03_metadata_header_structure(self):
        """Verify metadata header fields."""
        metrics = self.swe_results["display_metrics"]
        self.assertEqual(metrics["model_title"], "MODEL: FloodHADR SWE")
        self.assertIn("run_id", metrics)
        self.assertEqual(metrics["scenario_id"], "scen-tehri-pmf-001")
        self.assertIn("grid_resolution", metrics)
        self.assertEqual(metrics["dem"], "12.5m ALOS PALSAR DEM")
        self.assertIn("roughness", metrics)
        self.assertEqual(metrics["boundary_condition"], "OPEN_OUTFLOW")

    def test_04_numerical_diagnostics_and_validity(self):
        """Verify CFL number, timestep, mass balance error, NaN/Inf counts, and validity enforcement."""
        metrics = self.swe_results["display_metrics"]
        self.assertLessEqual(metrics["cfl"], 0.45)
        self.assertGreater(metrics["timestep_sec"], 0.0)
        self.assertLessEqual(metrics["mass_balance_error_percent"], 0.05)
        self.assertEqual(metrics["nan_count"], 0)
        self.assertEqual(metrics["inf_count"], 0)
        self.assertTrue(metrics["is_run_valid"])

if __name__ == "__main__":
    unittest.main()
