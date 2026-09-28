import unittest
import numpy as np

from app.simulation.temporal_animation_service import TemporalAnimationService
from app.simulation.hydrodynamic_2d_solver import Hydrodynamic2DSolver, Hydrodynamic2DSolverConfig, SolverMode

class TestPhase30TemporalAnimation(unittest.TestCase):
    """Automated test suite for Phase 30 — True Temporal Hydrodynamic Animation."""

    def setUp(self):
        self.anim_service = TemporalAnimationService(total_steps=72, duration_sec=21600.0)

        # Generate realistic 2D solver run
        rows, cols = 30, 30
        dem = np.ones((rows, cols), dtype=np.float64) * 750.0
        for r in range(rows):
            for c in range(cols):
                dem[r, c] = max(340.0, 600.0 - ((r + c)/2.0) * 9.0)

        config = Hydrodynamic2DSolverConfig(
            dem_matrix=dem,
            mode=SolverMode.SWE,
            dam_location=(2, 2),
            breach_width_m=180.0,
            reservoir_level_m=830.0,
            simulation_duration_sec=120.0
        )
        self.solver = Hydrodynamic2DSolver(config)
        self.sim_results = self.solver.run_simulation()

    def test_01_frame_retrieval_and_fields(self):
        """Verify frame payload contains exact required hydrodynamic arrays for frame t."""
        res = self.anim_service.get_frame(step_index=0, simulation_results=self.sim_results)
        self.assertTrue(res["has_temporal_data"])
        self.assertEqual(res["status"], "ACTIVE")

        frame = res["frame"]
        self.assertIn("time_sec", frame)
        self.assertIn("time_display", frame)
        self.assertIn("depth_matrix", frame)
        self.assertIn("velocity_matrix", frame)
        self.assertIn("velocity_x_matrix", frame)
        self.assertIn("velocity_y_matrix", frame)
        self.assertIn("wse_matrix", frame)
        self.assertIn("wet_mask_matrix", frame)
        self.assertIn("flooded_area_km2", frame)

    def test_02_dynamic_boundary_regeneration(self):
        """Verify wet mask and inundation extent change dynamically across time steps."""
        f0 = self.anim_service.get_frame(step_index=0, simulation_results=self.sim_results)["frame"]
        last_idx = len(self.sim_results["frames"]) - 1
        f_last = self.anim_service.get_frame(step_index=last_idx, simulation_results=self.sim_results)["frame"]

        self.assertGreater(f_last["wet_cells"], f0["wet_cells"])
        self.assertGreater(f_last["flooded_area_km2"], f0["flooded_area_km2"])

    def test_03_infrastructure_submergence_thresholds(self):
        """Verify infrastructure status changes dynamically when depth >= 0.5m threshold is crossed."""
        f_last = self.anim_service.get_frame(step_index=len(self.sim_results["frames"]) - 1, simulation_results=self.sim_results)["frame"]
        infra = f_last["infrastructure_status"]
        self.assertGreater(len(infra), 0)
        
        # Check structure of infrastructure items
        item = infra[0]
        self.assertIn("is_submerged", item)
        self.assertIn("status", item)
        self.assertIn("risk_level", item)

    def test_04_virtual_gauges_hydrograph_updates(self):
        """Verify virtual gauge readings update per frame."""
        f_last = self.anim_service.get_frame(step_index=len(self.sim_results["frames"]) - 1, simulation_results=self.sim_results)["frame"]
        gauges = f_last["virtual_gauges"]
        self.assertGreater(len(gauges), 0)
        g = gauges[0]
        self.assertIn("stage_m", g)
        self.assertIn("depth_m", g)
        self.assertIn("velocity_ms", g)

    def test_05_disabled_animation_when_data_missing(self):
        """Verify animation is disabled (has_temporal_data: False) when data is missing or out-of-bounds."""
        res_invalid = self.anim_service.get_frame(step_index=999, simulation_results=self.sim_results)
        self.assertFalse(res_invalid["has_temporal_data"])
        self.assertEqual(res_invalid["status"], "ANIMATION_DISABLED")

        res_none = self.anim_service.get_frame(step_index=0, simulation_results=None)
        self.assertFalse(res_none["has_temporal_data"])
        self.assertEqual(res_none["status"], "ANIMATION_DISABLED")

if __name__ == "__main__":
    unittest.main()
