import os
import sys
import unittest

# Add app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.simulation.predictive_hazard_engine import PredictiveHazardEngine

class TestPhase11PredictiveEnsemble(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.engine = PredictiveHazardEngine()

    def test_engine_scenarios_generation(self):
        """Test direct engine definitions of ensemble scenarios A through F."""
        scenarios = self.engine.get_ensemble_scenarios_definition()
        self.assertEqual(len(scenarios), 6)
        
        codes = [s["id"] for s in scenarios]
        expected_codes = ["SCEN_A", "SCEN_B", "SCEN_C", "SCEN_D", "SCEN_E", "SCEN_F"]
        self.assertEqual(codes, expected_codes)

        # Check envelope mappings
        envelopes = [s["envelope"] for s in scenarios]
        self.assertIn("Plausible Minimum", envelopes)
        self.assertIn("Typical", envelopes)
        self.assertIn("High", envelopes)
        self.assertIn("Plausible Maximum", envelopes)
        self.assertIn("Extreme Stress Scenario", envelopes)

    def test_statistical_rigor_and_uncertainty(self):
        """Verify mandatory probability notice and uncertainty formatting."""
        res = self.engine.evaluate_scenario("SCEN_D")
        
        # Rigorous probability notice
        self.assertIn("statistical_rigor_notice", res)
        self.assertIn("Scenario envelope", res["statistical_rigor_notice"])
        self.assertIn("probability not statistically calibrated", res["statistical_rigor_notice"])

        # Uncertainty ranges check
        ranges = res["uncertainty_ranges"]
        self.assertIn("peak_discharge_range_m3s", ranges)
        self.assertIn("flood_inundation_area_range_km2", ranges)
        self.assertIn("max_water_depth_range_m", ranges)
        self.assertIn("max_velocity_range_ms", ranges)

        # Check affected assets list
        self.assertIn("affected_assets", res)
        self.assertIsInstance(res["affected_assets"], list)
        self.assertGreater(len(res["affected_assets"]), 0)

    def test_api_scenarios_endpoint(self):
        """Test GET /api/predictive/scenarios"""
        response = self.client.get("/api/predictive/scenarios")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 6)

    def test_api_evaluate_endpoint(self):
        """Test POST /api/predictive/evaluate for custom scenario ID"""
        payload = {
            "scenario_id": "SCEN_E"
        }
        response = self.client.post("/api/predictive/evaluate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["scenario"]["id"], "SCEN_E")
        self.assertIn("probability not statistically calibrated", data["statistical_rigor_notice"])
        self.assertGreater(data["calculated_hydraulics"]["peak_discharge_m3s"], 15000)

    def test_api_ensemble_matrix(self):
        """Test GET /api/predictive/ensemble-matrix"""
        response = self.client.get("/api/predictive/ensemble-matrix")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["engine_metadata"]["scenario_count"], 6)
        self.assertEqual(len(data["ensemble_matrix"]), 6)
        self.assertIn("probability not statistically calibrated", data["statistical_rigor_notice"])

if __name__ == "__main__":
    unittest.main()
