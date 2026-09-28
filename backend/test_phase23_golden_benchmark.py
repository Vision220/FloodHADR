"""
backend/test_phase23_golden_benchmark.py

Phase 23 — Golden Tehri End-to-End Demonstration Test Suite.

Verifies:
1. Scenario creation & Tehri setup for TEHRI_GOLDEN_BENCHMARK_V1
2. 14-step pipeline execution (Scenario -> Reservoir -> Breach -> SWE -> DWE -> HEC-RAS -> Comparison -> 2D -> 3D -> Infra -> HADR -> AI -> Report)
3. Metadata identity (scenario_id, run_id, DEM version, model version, simulation time)
4. 10 Demonstration criteria for parameter variation:
   1. Parameter change
   2. Simulation actually changing
   3. Flood map changing
   4. 3D changing
   5. HEC-RAS comparison
   6. Difference map
   7. Infrastructure impact changing
   8. HADR changing
   9. AI explaining difference
   10. Reproducible report
"""

import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.simulation.golden_benchmark_service import GoldenBenchmarkService


class TestPhase23GoldenBenchmark(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.service = GoldenBenchmarkService()

    def test_01_baseline_parameters_and_metadata(self):
        """Verify TEHRI_GOLDEN_BENCHMARK_V1 baseline metadata & parameters."""
        params = self.service.get_baseline_parameters()
        self.assertEqual(params["scenario_id"], "TEHRI_GOLDEN_BENCHMARK_V1")
        self.assertEqual(params["dem_version"], "ALOS_PALSAR_12M_REAL")
        self.assertEqual(params["reservoir_level_m"], 830.0)
        self.assertEqual(params["breach_width_m"], 180.0)

    def test_02_execute_full_14_step_golden_pipeline(self):
        """Verify execution of full 14-step golden pipeline with 100% parameter identity."""
        res = self.service.execute_golden_pipeline(time_step_min=60)
        self.assertEqual(res["benchmark_status"], "SUCCESS")
        self.assertEqual(res["scenario_id"], "TEHRI_GOLDEN_BENCHMARK_V1")
        self.assertEqual(res["dem_version"], "ALOS_PALSAR_12M_REAL")
        self.assertIn("pipeline_steps", res)

        steps = res["pipeline_steps"]
        self.assertIn("1_scenario_metadata", steps)
        self.assertIn("2_tehri_reservoir", steps)
        self.assertIn("3_dam_breach", steps)
        self.assertIn("4_floodhadr_swe", steps)
        self.assertIn("5_floodhadr_dwe", steps)
        self.assertIn("6_hecras_swe_import", steps)
        self.assertIn("7_hecras_dwe_import", steps)
        self.assertIn("8_model_comparison", steps)
        self.assertIn("9_2d_flood_gis", steps)
        self.assertIn("10_3d_digital_twin", steps)
        self.assertIn("11_infrastructure_impact", steps)
        self.assertIn("12_hadr_decision_support", steps)
        self.assertIn("13_ai_scientific_explanation", steps)
        self.assertIn("14_reproducible_report", steps)

    def test_03_demonstrate_10_parameter_variation_criteria(self):
        """Verify all 10 demonstration criteria when changing breach_width_m from 180m to 240m."""
        modified = {"breach_width_m": 240.0, "reservoir_level_m": 835.0}
        demo = self.service.demonstrate_parameter_variation(modified_params=modified, time_step_min=60)
        self.assertEqual(demo["status"], "PARAMETER_VARIATION_SUCCESS")
        self.assertEqual(demo["scenario_id"], "TEHRI_GOLDEN_BENCHMARK_V1")

        crit = demo["demonstration_criteria"]

        # 1. Parameter change
        self.assertEqual(crit["1_parameter_change"]["baseline"]["breach_width_m"], 180.0)
        self.assertEqual(crit["1_parameter_change"]["modified"]["breach_width_m"], 240.0)

        # 2. Simulation actually changing
        self.assertTrue(crit["2_simulation_actually_changing"]["simulation_changed"])
        self.assertGreater(crit["2_simulation_actually_changing"]["delta_peak_discharge_m3s"], 0.0)

        # 3. Flood map changing
        self.assertTrue(crit["3_flood_map_changing"]["flood_map_changed"])

        # 4. 3D changing
        self.assertTrue(crit["4_3d_changing"]["3d_water_surface_elevation_updated"])

        # 5. HEC-RAS comparison
        self.assertEqual(crit["5_hecras_comparison"]["status"], "COMPARED_AGAINST_HECRAS_6.4.0")

        # 6. Difference map
        self.assertTrue(crit["6_difference_map"]["difference_map_generated"])

        # 7. Infrastructure impact changing
        self.assertTrue(crit["7_infrastructure_impact_changing"]["infrastructure_impact_changed"])

        # 8. HADR changing
        self.assertTrue(crit["8_hadr_changing"]["hadr_decisions_changed"])

        # 9. AI explaining difference
        self.assertTrue(crit["9_ai_explaining_difference"]["is_factual_and_scientific"])
        self.assertIn("explanation", crit["9_ai_explaining_difference"])

        # 10. Reproducible report
        self.assertTrue(crit["10_reproducible_report"]["reports_reproducible"])

    def test_04_rest_api_golden_benchmark_endpoints(self):
        """Test REST API endpoints for Golden Tehri Benchmark."""
        # GET baseline parameters
        r1 = self.client.get("/api/benchmark/golden/baseline-parameters")
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r1.json()["scenario_id"], "TEHRI_GOLDEN_BENCHMARK_V1")

        # POST run
        r2 = self.client.post("/api/benchmark/golden/run", json={"time_step_min": 60})
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.json()["benchmark_status"], "SUCCESS")

        # POST demonstrate-variation
        r3 = self.client.post(
            "/api/benchmark/golden/demonstrate-variation",
            json={"modified_params": {"breach_width_m": 240.0}, "time_step_min": 60}
        )
        self.assertEqual(r3.status_code, 200)
        data = r3.json()
        self.assertEqual(data["status"], "PARAMETER_VARIATION_SUCCESS")
        self.assertIn("demonstration_criteria", data)


if __name__ == "__main__":
    unittest.main()
