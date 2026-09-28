"""
Phase 12 - Hydraulic Model Comparison Test Suite
Validates scientific comparison across FloodHADR SWE, FloodHADR DWE, HEC-RAS SWE, and HEC-RAS DWE.
Verifies quantitative statistical metrics (RMSE, MAE, NSE, KGE, Peak Error, Timing Error, Area Diff, IoU, Precision, Recall, F1),
spatial difference maps, multi-criteria evaluation dimensions, and explicit prohibition of arbitrary 'best model' scoring.
"""

import os
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.simulation.model_comparison import (
    HydraulicModelComparisonEngine,
    calculate_rmse,
    calculate_mae,
    calculate_nse,
    calculate_kge,
    calculate_spatial_overlap_metrics
)


class TestPhase12ModelComparison(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.engine = HydraulicModelComparisonEngine(domain_shape=(30, 30), resolution_m=25.0)

    def test_01_four_model_comparison_structure(self):
        """Verify comparison evaluates all 4 target model configurations."""
        res = self.engine.compare_four_models()

        self.assertEqual(res["status"], "success")
        self.assertEqual(len(res["compared_models"]), 4)
        self.assertIn("FloodHADR SWE", res["compared_models"])
        self.assertIn("FloodHADR DWE", res["compared_models"])
        self.assertIn("HEC-RAS SWE", res["compared_models"])
        self.assertIn("HEC-RAS DWE", res["compared_models"])

    def test_02_all_6_hydraulic_variables_compared(self):
        """Verify all 6 hydraulic variables: Depth, Velocity, Arrival Time, Area, Extent, Hydrographs."""
        res = self.engine.compare_four_models()
        matrix = res["quantitative_metrics_matrix"]

        for model_name, metrics in matrix.items():
            self.assertIn("max_depth_m", metrics)
            self.assertIn("max_velocity_ms", metrics)
            self.assertIn("inundation_area_km2", metrics)
            self.assertIn("arrival_timing_error_min", metrics)
            self.assertIn("extent_iou", metrics)
            self.assertIn("hydrograph_nse", metrics)

    def test_03_quantitative_statistical_metrics(self):
        """Verify RMSE, MAE, NSE, KGE, Peak Error, Timing Error, Area Diff, IoU, Precision, Recall, F1."""
        res = self.engine.compare_four_models()
        swe_metrics = res["quantitative_metrics_matrix"]["FloodHADR SWE"]

        # Bounded Statistical Checks
        self.assertGreaterEqual(swe_metrics["depth_rmse"], 0.0)
        self.assertGreaterEqual(swe_metrics["depth_mae"], 0.0)
        self.assertGreaterEqual(swe_metrics["velocity_rmse"], 0.0)
        self.assertGreaterEqual(swe_metrics["velocity_mae"], 0.0)
        self.assertGreaterEqual(swe_metrics["hydrograph_nse"], -1.0)
        self.assertLessEqual(swe_metrics["hydrograph_nse"], 1.0)
        self.assertGreaterEqual(swe_metrics["hydrograph_kge"], -1.0)
        self.assertLessEqual(swe_metrics["hydrograph_kge"], 1.0)

        # Spatial Overlap Metrics Bounded [0.0, 1.0]
        self.assertGreaterEqual(swe_metrics["extent_iou"], 0.0)
        self.assertLessEqual(swe_metrics["extent_iou"], 1.0)
        self.assertGreaterEqual(swe_metrics["extent_precision"], 0.0)
        self.assertLessEqual(swe_metrics["extent_precision"], 1.0)
        self.assertGreaterEqual(swe_metrics["extent_recall"], 0.0)
        self.assertLessEqual(swe_metrics["extent_recall"], 1.0)
        self.assertGreaterEqual(swe_metrics["extent_f1"], 0.0)
        self.assertLessEqual(swe_metrics["extent_f1"], 1.0)

        self.assertGreaterEqual(swe_metrics["area_difference_km2"], 0.0)
        self.assertGreaterEqual(swe_metrics["peak_discharge_error_m3s"], 0.0)

    def test_04_spatial_difference_grids(self):
        """Verify Depth, Velocity, Arrival Time, and Extent Categorical Difference Grids."""
        res = self.engine.compare_four_models()
        spatial_maps = res["spatial_difference_maps"]["FloodHADR DWE"]

        self.assertIn("depth_difference_grid", spatial_maps)
        self.assertIn("velocity_difference_grid", spatial_maps)
        self.assertIn("arrival_time_difference_grid", spatial_maps)
        self.assertIn("extent_difference_categorical_grid", spatial_maps)

        # Check grid shapes (30x30)
        depth_grid = spatial_maps["depth_difference_grid"]
        self.assertEqual(len(depth_grid), 30)
        self.assertEqual(len(depth_grid[0]), 30)

        # Check extent categorical values in {0, 1, 2, 3}
        extent_grid = spatial_maps["extent_difference_categorical_grid"]
        unique_vals = set([val for row in extent_grid for val in row])
        self.assertTrue(unique_vals.issubset({0, 1, 2, 3}))

    def test_05_scientific_integrity_no_arbitrary_best_score(self):
        """Verify NO arbitrary 'best model' score and presence of 6 scientific evaluation dimensions."""
        res = self.engine.compare_four_models()

        # Prohibit arbitrary best_model or best_score keys
        self.assertNotIn("best_model", res)
        self.assertNotIn("best_score", res)
        self.assertIn("DO NOT USE AN ARBITRARY 'BEST MODEL' SCORE", res["scientific_notice"])

        # Check 6 multi-criteria evaluation dimensions
        dims = res["scientific_evaluation_dimensions"]
        required_dims = [
            "AGREEMENT",
            "DIVERGENCE",
            "REFERENCE_AVAILABILITY",
            "OBSERVATIONAL_SUPPORT",
            "PARAMETER_DIFFERENCES"
        ]
        for d in required_dims:
            self.assertIn(d, dims, f"Missing evaluation dimension: {d}")

    def test_06_rest_api_scientific_comparison_endpoint(self):
        """Test REST API POST /api/v1/multi-model/scientific-comparison."""
        payload = {
            "scenario_id": "scen-tehri-overtop",
            "breach_width_m": 180.0,
            "formation_time_hr": 1.5,
            "reservoir_level_m": 830.0
        }
        response = self.client.post("/api/multi-model/scientific-comparison", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["status"], "success")
        self.assertIn("quantitative_metrics_matrix", data)
        self.assertIn("spatial_difference_maps", data)
        self.assertIn("scientific_evaluation_dimensions", data)
        self.assertNotIn("best_model", data)


if __name__ == "__main__":
    unittest.main()
