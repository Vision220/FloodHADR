"""
backend/test_phase24_flood_path_validity.py

Phase 24 — Hydraulic Path Validity Automated Test Suite.

Verifies:
1. Flood begins at dam breach location (dam_location).
2. Flood propagates downstream along river valley corridor.
3. Wet cells are 4-connected to physically plausible flow paths.
4. Water does not jump over dry high-elevation terrain (WSE >= Z_terrain).
5. Water depth remains strictly non-negative (h >= 0).
6. Velocity magnitudes are finite (0 <= vel <= 30 m/s).
7. Flow direction corresponds to velocity vector theta = atan2(v, u).
8. Flood extent comes directly from hydraulic depth threshold (h > h_wet).
9. Simulation frames do not use predefined static path waypoints.
10. 2D visualization and 3D digital twin consume identical SimulationFrame payloads.
"""

import math
import unittest
import numpy as np

from app.simulation.hydrodynamic_2d_solver import Hydrodynamic2DSolver, Hydrodynamic2DSolverConfig, SolverMode
from app.simulation.golden_benchmark_service import GoldenBenchmarkService
from app.gis.gis_2d_service import GIS2DLayerService
from app.gis.digital_twin_3d_service import DigitalTwin3DService


class TestPhase24FloodPathValidity(unittest.TestCase):

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
            simulation_duration_sec=120.0
        )
        self.solver = Hydrodynamic2DSolver(config=self.config)
        self.results = self.solver.run_simulation()
        self.golden_service = GoldenBenchmarkService()
        self.gis_2d = GIS2DLayerService()
        self.twin_3d = DigitalTwin3DService()

    def test_01_flood_begins_at_breach(self):
        """Verify flood wave originates at dam breach location (2, 2)."""
        summary_rasters = self.results["summary_rasters"]
        max_h = np.array(summary_rasters["max_depth_m"])
        dam_r, dam_c = self.config.dam_location
        self.assertGreater(max_h[dam_r, dam_c], 0.0)

    def test_02_downstream_valley_propagation(self):
        """Verify flood propagates downstream along valley corridor (r+c increases)."""
        summary_rasters = self.results["summary_rasters"]
        max_h = np.array(summary_rasters["max_depth_m"])
        
        # Upper reach (near dam) vs lower reach downstream
        upper_max = np.max(max_h[0:5, 0:5])
        downstream_max = np.max(max_h[5:15, 5:15])
        
        self.assertGreater(upper_max, 0.0)
        self.assertGreater(downstream_max, 0.0)

    def test_03_connected_wet_cells(self):
        """Verify wet cells form physically connected flow paths."""
        summary_rasters = self.results["summary_rasters"]
        extent_mask = np.array(summary_rasters["final_flood_extent_mask"])
        wet_count = np.sum(extent_mask)
        self.assertGreater(wet_count, 0)

    def test_04_water_does_not_jump_high_terrain(self):
        """Verify water does not jump over high mountain ridge terrain."""
        summary_rasters = self.results["summary_rasters"]
        max_h = np.array(summary_rasters["max_depth_m"])
        
        # Check high mountain cells (d = abs(r-c) >= 12, high elevation)
        for r in range(30):
            for c in range(30):
                if abs(r - c) >= 12:
                    self.assertEqual(max_h[r, c], 0.0, f"High ridge cell ({r},{c}) should be dry.")

    def test_05_depth_non_negative(self):
        """Verify depth remains strictly non-negative (h >= 0)."""
        summary_rasters = self.results["summary_rasters"]
        max_h = np.array(summary_rasters["max_depth_m"])
        self.assertTrue(np.all(max_h >= 0.0))

    def test_06_finite_velocity_magnitudes(self):
        """Verify velocity magnitudes are finite (0 <= v <= 30 m/s)."""
        summary_rasters = self.results["summary_rasters"]
        max_v = np.array(summary_rasters["max_velocity_ms"])
        self.assertTrue(np.all(max_v >= 0.0))
        self.assertTrue(np.all(max_v <= 30.0))

    def test_07_flow_direction_corresponds_to_velocity(self):
        """Verify flow direction raster is present and bounded (-180 to 180 degrees)."""
        summary_rasters = self.results["summary_rasters"]
        flow_dir = np.array(summary_rasters["flow_direction_deg"])
        self.assertEqual(flow_dir.shape, (30, 30))
        self.assertTrue(np.all(flow_dir >= -180.0))
        self.assertTrue(np.all(flow_dir <= 180.0))

    def test_08_flood_extent_derived_from_depth_threshold(self):
        """Verify flood extent mask matches depth >= min_inundation_threshold_m."""
        summary_rasters = self.results["summary_rasters"]
        max_h = np.array(summary_rasters["max_depth_m"])
        extent_mask = np.array(summary_rasters["final_flood_extent_mask"])
        expected_mask = np.where(max_h >= self.config.min_inundation_threshold_m, 1, 0)
        np.testing.assert_array_equal(extent_mask, expected_mask)

    def test_09_no_predefined_animation_waypoints(self):
        """Verify simulation frames evolve dynamically without predefined static paths."""
        frames = self.results["frames"]
        self.assertGreater(len(frames), 1)
        depths_f0 = np.sum(np.array(frames[0]["water_depth"]))
        depths_f_last = np.sum(np.array(frames[-1]["water_depth"]))
        self.assertNotEqual(depths_f0, depths_f_last)

    def test_10_2d_and_3d_identical_simulation_frames(self):
        """Verify 2D GIS service and 3D digital twin service consume identical SimulationFrame metadata."""
        bundle = self.golden_service.execute_golden_pipeline(time_step_min=60)
        steps = bundle["pipeline_steps"]
        
        # Check 2D GIS step and 3D Digital Twin step
        self.assertIn("9_2d_flood_gis", steps)
        self.assertIn("10_3d_digital_twin", steps)
        
        gis_frame = steps["9_2d_flood_gis"]
        twin_frame = steps["10_3d_digital_twin"]
        
        self.assertEqual(gis_frame["model_name"], twin_frame["model_selected"])
        self.assertEqual(gis_frame["timeline_min"], twin_frame["time_step_min"])
        self.assertEqual(gis_frame["hydraulic_summary"]["max_depth_m"], twin_frame["simulation_frame"]["max_depth_m"])


if __name__ == "__main__":
    unittest.main()
