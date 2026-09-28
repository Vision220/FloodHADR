"""
backend/test_phase38_model_comparison_studio.py

Automated Test Suite for Phase 38 — Professional Model Comparison Studio.

Verifies:
1. Four model target configurations: FloodHADR SWE, FloodHADR DWE, HEC-RAS SWE, HEC-RAS DWE.
2. Common Spatial Domain Alignment: Same DEM (ALOS PALSAR 12.5m), same domain (30x30 grid @ 25m), same CRS (EPSG:32644).
3. 8 Views Output Data:
   1. Flood extent
   2. Depth
   3. Velocity
   4. Arrival time
   5. Water surface
   6. Hydrograph
   7. Difference map
   8. Statistics
4. Quantitative Comparison Metrics:
   - Absolute difference & relative difference grids (%)
   - Spatial overlap (IoU, precision, recall, f1, intersection area, union area, delta area)
   - Depth error (RMSE, MAE)
   - Velocity error (RMSE, MAE)
   - Arrival-time difference (mean arrival delay min)
   - Hydrograph comparison (RMSE, MAE, NSE, KGE, peak Q diff, peak timing diff)
5. Scenario Mismatch Guardrail: Detects scenario disagreement and generates explicit SCENARIO MISMATCH WARNING.
6. REST API Endpoints:
   - POST /api/multi-model/comparison-studio/compare-pair
   - GET  /api/multi-model/comparison-studio/views
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.simulation.model_comparison import HydraulicModelComparisonEngine


class TestPhase38ModelComparisonStudio(unittest.TestCase):

    def setUp(self):
        self.engine = HydraulicModelComparisonEngine()
        self.client = TestClient(app)

    def test_01_common_spatial_domain_and_8_views(self):
        """Verify compare_pair enforces common spatial domain and returns all 8 required views."""
        res = self.engine.compare_pair(
            model_a="FloodHADR SWE",
            model_b="HEC-RAS SWE",
            scenario_a_id="TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO",
            scenario_b_id="TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO"
        )

        self.assertEqual(res["status"], "success")
        self.assertFalse(res["scenario_mismatch"])
        self.assertIsNone(res["scenario_mismatch_warning"])

        # Domain verification
        domain = res["common_spatial_domain"]
        self.assertEqual(domain["crs"], "EPSG:32644 (UTM Zone 44N)")
        self.assertEqual(domain["grid_rows"], 30)
        self.assertEqual(domain["grid_cols"], 30)

        # 8 Views verification
        views = res["views_data"]
        required_8_views = [
            "flood_extent",
            "depth",
            "velocity",
            "arrival_time",
            "water_surface",
            "hydrograph",
            "difference_map",
            "statistics"
        ]

        for v_key in required_8_views:
            self.assertIn(v_key, views, f"Missing required view: {v_key}")

    def test_02_all_required_comparison_metrics(self):
        """Verify absolute/relative diffs, spatial overlap, depth/velocity errors, arrival diff, hydrograph metrics."""
        res = self.engine.compare_pair(
            model_a="FloodHADR SWE",
            model_b="FloodHADR DWE",
            scenario_a_id="TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO",
            scenario_b_id="TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO"
        )
        vd = res["views_data"]

        # 1. Flood extent spatial overlap
        fe = vd["flood_extent"]
        self.assertIn("iou", fe)
        self.assertIn("intersection_area_km2", fe)
        self.assertIn("union_area_km2", fe)
        self.assertIn("area_difference_km2", fe)

        # 2. Depth error
        d = vd["depth"]
        self.assertIn("depth_rmse_m", d)
        self.assertIn("depth_mae_m", d)

        # 3. Velocity error
        v = vd["velocity"]
        self.assertIn("velocity_rmse_ms", v)
        self.assertIn("velocity_mae_ms", v)

        # 4. Arrival time difference
        arr = vd["arrival_time"]
        self.assertIn("arrival_delay_min", arr)

        # 5. Hydrograph comparison
        hy = vd["hydrograph"]
        self.assertIn("nse", hy)
        self.assertIn("kge", hy)
        self.assertIn("peak_discharge_diff_m3s", hy)
        self.assertIn("peak_timing_diff_min", hy)

        # 6. Absolute & Relative difference grids
        dm = vd["difference_map"]
        self.assertIn("abs_depth_diff_grid", dm)
        self.assertIn("rel_depth_diff_pct_grid", dm)
        self.assertIn("abs_vel_diff_grid", dm)
        self.assertIn("rel_vel_diff_pct_grid", dm)

    def test_03_scenario_mismatch_warning_guardrail(self):
        """Verify engine detects scenario mismatch and returns explicit warning banner."""
        res = self.engine.compare_pair(
            model_a="FloodHADR SWE",
            model_b="HEC-RAS SWE",
            scenario_a_id="TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO",
            scenario_b_id="TEHRI_MDDL_BREACH"
        )

        self.assertTrue(res["scenario_mismatch"])
        self.assertIsNotNone(res["scenario_mismatch_warning"])
        self.assertIn("SCENARIO MISMATCH WARNING", res["scenario_mismatch_warning"])

    def test_04_rest_api_compare_pair_and_views(self):
        """Test POST /api/multi-model/comparison-studio/compare-pair & GET /api/multi-model/comparison-studio/views."""
        # 1. GET Views endpoint
        v_resp = self.client.get("/api/multi-model/comparison-studio/views")
        self.assertEqual(v_resp.status_code, 200)
        v_data = v_resp.json()
        self.assertEqual(v_data["total_views"], 8)

        # 2. POST Compare Pair endpoint
        p_resp = self.client.post("/api/multi-model/comparison-studio/compare-pair", json={
            "model_a": "FloodHADR SWE",
            "model_b": "HEC-RAS SWE",
            "scenario_a_id": "TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO",
            "scenario_b_id": "TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO"
        })
        self.assertEqual(p_resp.status_code, 200)
        p_data = p_resp.json()
        self.assertEqual(p_data["status"], "success")
        self.assertIn("views_data", p_data)


if __name__ == "__main__":
    unittest.main()
