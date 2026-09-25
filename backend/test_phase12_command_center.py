import os
import sys
import unittest

# Add app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

class TestPhase12CommandCenter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_command_center_integrated_endpoints(self):
        """Verify responsiveness of core backend services powering the Command Center."""
        
        # 1. Telemetry Sensors
        res_sensors = self.client.get("/api/sensors/live-status")
        self.assertEqual(res_sensors.status_code, 200)
        self.assertEqual(res_sensors.json()["live_status"], "ONLINE")

        # 2. Predictive Ensemble Matrix
        res_ensemble = self.client.get("/api/predictive/ensemble-matrix")
        self.assertEqual(res_ensemble.status_code, 200)
        self.assertEqual(res_ensemble.json()["status"], "SUCCESS")

        # 3. Climate Risk Sensitivity
        res_climate = self.client.get("/api/climate/horizons")
        self.assertEqual(res_climate.status_code, 200)

        # 4. Landslide River Blockage
        res_landslide = self.client.get("/api/landslides/inventory")
        self.assertEqual(res_landslide.status_code, 200)

        # 5. Multi-Model Comparison Studio
        res_models = self.client.get("/api/multi-model/models")
        self.assertEqual(res_models.status_code, 200)

    def test_command_center_scenario_pipeline_trigger(self):
        """Test full predictive evaluation call matching Command Center input sliders."""
        payload = {
            "scenario_id": "SCEN_E"
        }
        res = self.client.post("/api/predictive/evaluate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        self.assertIn("calculated_hydraulics", data)
        self.assertIn("uncertainty_ranges", data)
        self.assertIn("statistical_rigor_notice", data)
        self.assertEqual(data["statistical_rigor_notice"], "Scenario envelope — probability not statistically calibrated.")

if __name__ == "__main__":
    unittest.main()
