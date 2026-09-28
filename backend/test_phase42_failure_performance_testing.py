"""
backend/test_phase42_failure_performance_testing.py

Automated Test Suite for PHASE 42 — FLOODHADR FAILURE AND PERFORMANCE TESTING.

Verifies:
1. All 12 failure & edge-case scenarios fail safely with explicit status banners:
   - DATA UNAVAILABLE
   - MODEL FAILED
   - INVALID INPUT
   - REFERENCE RESULT NOT AVAILABLE
   - GEE NOT CONFIGURED
2. Errors are NEVER silently swallowed or substituted with fake scientific results.
3. Performance metrics measured:
   - simulation time (sec)
   - memory usage (MB)
   - API latency (ms)
   - frame loading time (ms)
   - 3D rendering FPS
   - large-raster performance (ms)
   - database query time (ms)
4. REST API endpoints GET /api/gis/failure-tests and GET /api/gis/performance-metrics.
"""

import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.simulation.failure_performance_service import FailureAndPerformanceTestingService


class TestPhase42FailureAndPerformance(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_01_failure_modes_and_edge_cases(self):
        """Verify all failure & edge-case scenarios pass with safe failure handling."""
        res = FailureAndPerformanceTestingService.test_failure_modes()

        self.assertEqual(res["status"], "FAILURE_TESTING_COMPLETE")
        self.assertTrue(res["all_failure_tests_passed"])
        self.assertEqual(res["total_failure_scenarios"], 12)

        for case in res["test_results"]:
            self.assertTrue(case["safe_failure_passed"], f"Failed test case: {case['test_case']}")
            self.assertFalse(case["error_silently_swallowed"], f"Error swallowed in: {case['test_case']}")

    def test_02_status_banners_explicit_labeling(self):
        """Verify explicit status banners are generated appropriately."""
        res = FailureAndPerformanceTestingService.test_failure_modes()
        banners = {case["expected_banner"] for case in res["test_results"]}

        required_banners = {
            "DATA UNAVAILABLE",
            "MODEL FAILED",
            "INVALID INPUT",
            "REFERENCE RESULT NOT AVAILABLE",
            "GEE NOT CONFIGURED"
        }

        self.assertTrue(required_banners.issubset(banners))

    def test_03_performance_metrics_measurement(self):
        """Verify system performance metrics are calculated correctly."""
        metrics_res = FailureAndPerformanceTestingService.measure_performance_benchmarks()

        self.assertEqual(metrics_res["status"], "PERFORMANCE_MEASUREMENT_COMPLETE")
        p = metrics_res["performance_metrics"]

        self.assertIn("simulation_time_sec", p)
        self.assertIn("memory_usage_mb", p)
        self.assertIn("api_latency_ms", p)
        self.assertIn("frame_loading_time_ms", p)
        self.assertIn("rendering_fps_estimate", p)
        self.assertIn("large_raster_performance_ms", p)
        self.assertIn("database_query_time_ms", p)

        self.assertGreater(p["memory_usage_mb"], 0.0)
        self.assertGreaterEqual(p["rendering_fps_estimate"], 30.0)

    def test_04_rest_api_failure_and_performance_endpoints(self):
        """Test GET /api/gis/failure-tests and GET /api/gis/performance-metrics REST endpoints."""
        # 1. Failure tests route
        r1 = self.client.get("/api/gis/failure-tests")
        self.assertEqual(r1.status_code, 200)
        data1 = r1.json()
        self.assertEqual(data1["status"], "FAILURE_TESTING_COMPLETE")
        self.assertTrue(data1["all_failure_tests_passed"])

        # 2. Performance metrics route
        r2 = self.client.get("/api/gis/performance-metrics")
        self.assertEqual(r2.status_code, 200)
        data2 = r2.json()
        self.assertEqual(data2["status"], "PERFORMANCE_MEASUREMENT_COMPLETE")
        self.assertIn("simulation_time_sec", data2["performance_metrics"])


if __name__ == "__main__":
    unittest.main()
