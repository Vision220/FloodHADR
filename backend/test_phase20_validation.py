"""
backend/test_phase20_validation.py

Comprehensive test suite for Phase 20 — Validation and Sensitivity:
1. Verifies 6 strict scientific validation status classifications (VALIDATED, PARTIALLY_VALIDATED, UNVALIDATED, SCENARIO, EXPERIMENTAL, DEMO).
2. Verifies scientific observational metrics: RMSE, MAE, NSE, KGE, Peak Error, Timing Error, IoU, F1 score.
3. Verifies parameter sensitivity testing across 7 core parameters:
   - breach width
   - breach formation time
   - reservoir level
   - Manning's n
   - DEM resolution
   - mesh resolution
   - downstream boundary
4. Verifies REST API endpoints via TestClient.
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.simulation.validation_sensitivity_service import ValidationSensitivityService


class TestPhase20ValidationSensitivity(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.service = ValidationSensitivityService()

    def test_01_status_classifications(self):
        """Verify the 6 strict scientific status classifications and prohibition of arbitrary confidence scores."""
        res = self.service.get_status_classifications()
        statuses = res["statuses"]
        expected = ["VALIDATED", "PARTIALLY_VALIDATED", "UNVALIDATED", "SCENARIO", "EXPERIMENTAL", "DEMO"]
        for st in expected:
            self.assertIn(st, statuses)
        self.assertIn("Do not fabricate", res["rule"])

    def test_02_evaluate_observations_metrics(self):
        """Verify calculation of RMSE, MAE, NSE, KGE, Peak Error, Timing Error, IoU, and F1."""
        sim = [1500.0, 3200.0, 5800.0, 6400.0, 4900.0, 3100.0]
        obs = [1400.0, 2800.0, 5200.0, 6100.0, 4700.0, 3200.0]
        res = self.service.evaluate_observations(
            simulated_hydrograph=sim,
            observed_hydrograph=obs,
            simulated_extent_km2=45.0,
            observed_extent_km2=42.5,
            dataset_id="HISTORICAL_2013_EVENT"
        )
        self.assertEqual(res["dataset_id"], "HISTORICAL_2013_EVENT")
        self.assertEqual(res["status_classification"], "PARTIALLY_VALIDATED")

        metrics = res["metrics"]
        self.assertIn("rmse", metrics)
        self.assertIn("mae", metrics)
        self.assertIn("nse", metrics)
        self.assertIn("kge", metrics)
        self.assertIn("peak_error_m3s", metrics)
        self.assertIn("timing_error_steps", metrics)
        self.assertIn("iou", metrics)
        self.assertIn("f1_score", metrics)

        # Check objective calculations
        self.assertGreater(metrics["rmse"], 0.0)
        self.assertGreater(metrics["mae"], 0.0)
        self.assertGreaterEqual(metrics["nse"], -1.0)
        self.assertGreaterEqual(metrics["iou"], 0.0)
        self.assertLessEqual(metrics["iou"], 1.0)

    def test_03_sensitivity_analysis_7_parameters(self):
        """Verify sensitivity analysis across 7 core physical and grid parameters."""
        res = self.service.run_sensitivity_analysis()
        self.assertEqual(res["sensitivity_status"], "COMPLETED")
        sens = res["parameter_sensitivities"]

        # 7 core parameters
        self.assertIn("breach_width_m", sens)
        self.assertIn("breach_formation_time_hr", sens)
        self.assertIn("reservoir_level_m", sens)
        self.assertIn("mannings_n", sens)
        self.assertIn("dem_resolution_m", sens)
        self.assertIn("mesh_resolution", sens)
        self.assertIn("downstream_boundary", sens)

        self.assertIn("sensitivity_index", sens["breach_width_m"])
        self.assertIn("sensitivity_index", sens["breach_formation_time_hr"])

    def test_04_api_validation_status(self):
        """Verify GET /api/validation/status REST API endpoint."""
        response = self.client.get("/api/validation/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status_definitions", data)
        self.assertIn("available_datasets", data)

    def test_05_api_validation_evaluate(self):
        """Verify POST /api/validation/evaluate REST API endpoint."""
        payload = {
            "simulated_hydrograph": [1000, 2000, 3000],
            "observed_hydrograph": [950, 1950, 2900],
            "simulated_extent_km2": 50.0,
            "observed_extent_km2": 48.0,
            "dataset_id": "HISTORICAL_2013_EVENT"
        }
        response = self.client.post("/api/validation/evaluate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("metrics", data)
        self.assertEqual(data["dataset_id"], "HISTORICAL_2013_EVENT")

    def test_06_api_validation_sensitivity(self):
        """Verify POST /api/validation/sensitivity REST API endpoint."""
        payload = {"base_params": {"breach_width_m": 200.0, "breach_formation_time_hr": 1.2}}
        response = self.client.post("/api/validation/sensitivity", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["sensitivity_status"], "COMPLETED")
        self.assertIn("parameter_sensitivities", data)



if __name__ == "__main__":
    unittest.main()
