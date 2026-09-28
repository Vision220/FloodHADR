"""
backend/test_phase19_scenario_lab.py

Comprehensive test suite for Phase 19 — Scenario Comparison Lab:
1. Verifies 10 preconfigured scenario presets.
2. Verifies scenario duplication and modification across 13 parameters.
3. Verifies side-by-side scenario comparison calculating 6 quantitative difference metrics:
   - depth difference (Delta h)
   - velocity difference (Delta v)
   - arrival-time difference (Delta t_arr)
   - inundation-area difference (Delta A)
   - affected population difference (Delta Pop)
   - infrastructure difference (Delta Infra)
4. Verifies Scenario Lab REST API endpoints via TestClient.
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.simulation.scenario_lab_service import ScenarioLabService


class TestPhase19ScenarioLab(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.lab = ScenarioLabService()

    def test_01_preconfigured_presets(self):
        """Verify all 10 preconfigured scenario presets are returned with valid parameters."""
        res = self.lab.get_presets()
        self.assertEqual(res["total_presets"], 10)
        expected_presets = [
            "BASELINE", "MDDL", "MID_STORAGE", "FRL", "EXTREME_INFLOW",
            "PMF", "PARTIAL_BREACH", "RAPID_BREACH", "SLOW_BREACH", "USER_DEFINED"
        ]
        for preset_id in expected_presets:
            self.assertIn(preset_id, res["presets"])
            preset = res["presets"][preset_id]
            # Check presence of key parameters
            self.assertIn("reservoir_level_m", preset)
            self.assertIn("inflow_m3s", preset)
            self.assertIn("rainfall_mm", preset)
            self.assertIn("breach_width_m", preset)
            self.assertIn("breach_formation_time_hr", preset)
            self.assertIn("breach_elevation_m", preset)
            self.assertIn("breach_type", preset)
            self.assertIn("mannings_n", preset)
            self.assertIn("dem_dataset", preset)
            self.assertIn("downstream_boundary", preset)
            self.assertIn("model_selected", preset)
            self.assertIn("mesh_resolution", preset)
            self.assertIn("simulation_duration_hr", preset)

    def test_02_duplicate_and_modify_13_parameters(self):
        """Verify scenario duplication and modification across 13 parameters."""
        mods = {
            "reservoir_level_m": 832.5,
            "inflow_m3s": 5000.0,
            "rainfall_mm": 90.0,
            "breach_width_m": 210.0,
            "breach_formation_time_hr": 1.0,
            "breach_elevation_m": 705.0,
            "breach_type": "RAPID",
            "mannings_n": 0.040,
            "dem_dataset": "ALOS_PALSAR_12M_REAL",
            "downstream_boundary": "NORMAL_DEPTH",
            "model_selected": "HEC-RAS SWE",
            "mesh_resolution": "FINE_5M",
            "simulation_duration_hr": 10.0
        }
        dup = self.lab.duplicate_and_modify(base_preset_id="BASELINE", modifications=mods)
        self.assertEqual(dup["preset_id"], "USER_DEFINED")
        self.assertEqual(dup["reservoir_level_m"], 832.5)
        self.assertEqual(dup["inflow_m3s"], 5000.0)
        self.assertEqual(dup["rainfall_mm"], 90.0)
        self.assertEqual(dup["breach_width_m"], 210.0)
        self.assertEqual(dup["breach_formation_time_hr"], 1.0)
        self.assertEqual(dup["breach_elevation_m"], 705.0)
        self.assertEqual(dup["breach_type"], "RAPID")
        self.assertEqual(dup["mannings_n"], 0.040)
        self.assertEqual(dup["dem_dataset"], "ALOS_PALSAR_12M_REAL")
        self.assertEqual(dup["downstream_boundary"], "NORMAL_DEPTH")
        self.assertEqual(dup["model_selected"], "HEC-RAS SWE")
        self.assertEqual(dup["mesh_resolution"], "FINE_5M")
        self.assertEqual(dup["simulation_duration_hr"], 10.0)

    def test_03_side_by_side_comparison_metrics(self):
        """Verify side-by-side comparison generates all 6 required difference metrics."""
        scen_a = self.lab.preconfigured_presets["BASELINE"]
        scen_b = self.lab.preconfigured_presets["RAPID_BREACH"]

        res = self.lab.compare_side_by_side(scenario_a_params=scen_a, scenario_b_params=scen_b)
        self.assertEqual(res["lab_status"], "COMPARISON_COMPLETED")
        self.assertIn("differences", res)
        diffs = res["differences"]

        # Verify all 6 required difference metrics are present
        self.assertIn("depth_difference_m", diffs)
        self.assertIn("velocity_difference_ms", diffs)
        self.assertIn("arrival_time_difference_min", diffs)
        self.assertIn("inundation_area_difference_km2", diffs)
        self.assertIn("affected_population_difference", diffs)
        self.assertIn("infrastructure_difference", diffs)
        self.assertIn("summary", diffs)

    def test_04_api_scenario_lab_presets(self):
        """Verify GET /api/scenarios/lab/presets REST API endpoint."""
        response = self.client.get("/api/scenarios/lab/presets")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_presets"], 10)
        self.assertIn("BASELINE", data["presets"])

    def test_05_api_scenario_lab_duplicate(self):
        """Verify POST /api/scenarios/lab/duplicate REST API endpoint."""
        payload = {
            "base_preset_id": "BASELINE",
            "modifications": {
                "breach_width_m": 250.0,
                "model_selected": "HEC-RAS DWE"
            }
        }
        response = self.client.post("/api/scenarios/lab/duplicate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["breach_width_m"], 250.0)
        self.assertEqual(data["model_selected"], "HEC-RAS DWE")

    def test_06_api_scenario_lab_compare(self):
        """Verify POST /api/scenarios/lab/compare REST API endpoint."""
        scen_a = self.lab.preconfigured_presets["BASELINE"]
        scen_b = self.lab.preconfigured_presets["PMF"]
        payload = {
            "scenario_a": scen_a,
            "scenario_b": scen_b,
            "time_step_min": 60
        }
        response = self.client.post("/api/scenarios/lab/compare", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["lab_status"], "COMPARISON_COMPLETED")
        self.assertIn("differences", data)


if __name__ == "__main__":
    unittest.main()
