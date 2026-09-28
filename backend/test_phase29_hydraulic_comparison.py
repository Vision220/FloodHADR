import unittest
import numpy as np

from app.simulation.model_comparison import HydraulicModelComparisonEngine

class TestPhase29HydraulicComparison(unittest.TestCase):
    """Automated test suite for Phase 29 — Hydraulic Model Comparison Engine."""

    def setUp(self):
        self.engine = HydraulicModelComparisonEngine(domain_shape=(30, 30), resolution_m=25.0)
        self.comparison_res = self.engine.compare_four_models({
            "scenario_id": "scen-tehri-overtop",
            "breach_width_m": 180.0,
            "reservoir_level_m": 830.0
        })

    def test_01_scalar_metrics_for_every_model(self):
        """Verify 6 scalar metrics are present for all 4 hydraulic models."""
        matrix = self.comparison_res["quantitative_metrics_matrix"]
        expected_models = ["FloodHADR SWE", "FloodHADR DWE", "HEC-RAS SWE", "HEC-RAS DWE"]

        for m in expected_models:
            self.assertIn(m, matrix)
            mod = matrix[m]
            self.assertIn("peak_discharge_m3s", mod)
            self.assertIn("max_depth_m", mod)
            self.assertIn("max_velocity_ms", mod)
            self.assertIn("flood_arrival_time_min", mod)
            self.assertIn("inundation_area_km2", mod)
            self.assertIn("flood_duration_hr", mod)

            self.assertGreater(mod["peak_discharge_m3s"], 0.0)
            self.assertGreater(mod["max_depth_m"], 0.0)

    def test_02_spatial_comparison_metrics(self):
        """Verify spatial comparison metrics (IoU, intersection, union, area diff, depth/velocity RMSE/MAE, arrival error)."""
        matrix = self.comparison_res["quantitative_metrics_matrix"]

        for m, mod in matrix.items():
            self.assertIn("extent_iou", mod)
            self.assertIn("intersection_area_km2", mod)
            self.assertIn("union_area_km2", mod)
            self.assertIn("area_difference_km2", mod)
            self.assertIn("depth_rmse", mod)
            self.assertIn("depth_mae", mod)
            self.assertIn("velocity_rmse", mod)
            self.assertIn("arrival_time_error_min", mod)

            self.assertGreaterEqual(mod["extent_iou"], 0.0)
            self.assertLessEqual(mod["extent_iou"], 1.0)
            self.assertGreaterEqual(mod["intersection_area_km2"], 0.0)
            self.assertGreaterEqual(mod["union_area_km2"], mod["intersection_area_km2"])

    def test_03_temporal_comparison_metrics(self):
        """Verify temporal comparison metrics (peak timing error, peak discharge diff, hydrograph RMSE/MAE/NSE/KGE)."""
        matrix = self.comparison_res["quantitative_metrics_matrix"]

        for m, mod in matrix.items():
            self.assertIn("peak_timing_error_min", mod)
            self.assertIn("peak_discharge_difference_m3s", mod)
            self.assertIn("hydrograph_rmse", mod)
            self.assertIn("hydrograph_mae", mod)
            self.assertIn("hydrograph_nse", mod)
            self.assertIn("hydrograph_kge", mod)

    def test_04_spatial_difference_maps(self):
        """Verify difference maps (FloodHADR - HEC-RAS depth, velocity, arrival time, extent disagreement)."""
        maps = self.comparison_res["spatial_difference_maps"]
        expected_models = ["FloodHADR SWE", "FloodHADR DWE", "HEC-RAS SWE", "HEC-RAS DWE"]

        for m in expected_models:
            self.assertIn(m, maps)
            m_map = maps[m]
            self.assertIn("depth_difference_grid", m_map)
            self.assertIn("velocity_difference_grid", m_map)
            self.assertIn("arrival_time_difference_grid", m_map)
            self.assertIn("extent_disagreement_categorical_grid", m_map)

            # Grid shape check (30x30)
            d_grid = np.array(m_map["depth_difference_grid"])
            self.assertEqual(d_grid.shape, (30, 30))

    def test_05_multi_criteria_scientific_dimensions(self):
        """Verify no overall best model score is generated, and 5 multi-criteria evaluation dimensions exist."""
        # Ensure 'best_model_score' or 'overall_winner' is NOT present
        self.assertNotIn("best_model_score", self.comparison_res)
        self.assertNotIn("overall_winner", self.comparison_res)

        dimensions = self.comparison_res["scientific_evaluation_dimensions"]
        self.assertIn("AGREEMENT", dimensions)
        self.assertIn("DIVERGENCE", dimensions)
        self.assertIn("REFERENCE_AVAILABILITY", dimensions)
        self.assertIn("OBSERVATIONAL_SUPPORT", dimensions)
        self.assertIn("PARAMETER_DIFFERENCES", dimensions)

        self.assertIn("SCIENTIFIC MANDATE", self.comparison_res["scientific_notice"])

if __name__ == "__main__":
    unittest.main()
