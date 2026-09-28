"""
backend/test_phase35_tehri_scenarios.py

Unit and integration test suite for Phase 35: Correct Tehri Flood and Dam-Break Scenarios.

Verifies:
1. Explicit scenario separation: PMF routing without failure, overtopping failure, FRL breach, MDDL breach, spillway operation, extreme inflow, user-defined.
2. Rule enforcement: PMF != dam break (pmf_equals_dam_break == False).
3. Inventory of all 12 mandatory schema parameters for every scenario:
   - reservoir_level_m
   - initial_storage_mm3
   - inflow_hydrograph
   - spillway_operation
   - breach_occurrence
   - breach_start_time_hr
   - breach_bottom_elevation_m
   - final_breach_width_m
   - breach_formation_time_hr
   - breach_side_slopes_hv
   - downstream_boundary
   - simulation_duration_hr
4. Explicit assumptions metadata for every scenario.
5. Hydrodynamic evaluation logic (NO breach flow added when breach_occurrence == False).
6. REST API endpoints (/api/scenarios/tehri/catalog, /api/scenarios/tehri/{scenario_id}, /api/scenarios/tehri/evaluate).
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.simulation.tehri_scenario_service import TehriScenarioService


class TestPhase35TehriScenarios(unittest.TestCase):
    """
    Test suite for Phase 35 Tehri scenario management engine.
    """

    def setUp(self):
        self.service = TehriScenarioService()
        self.client = TestClient(app)

    def test_scenario_catalog_separation(self):
        """
        Verifies explicit separation of required scenario categories and rule PMF != dam break.
        """
        catalog = self.service.get_all_scenarios()
        self.assertFalse(catalog["pmf_equals_dam_break"])
        self.assertEqual(catalog["rule_notice"], "PMF is NOT automatically equated to a dam break.")
        
        scenarios = catalog["scenarios"]
        self.assertIn("TEHRI_PMF_NO_FAILURE", scenarios)
        self.assertIn("TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO", scenarios)
        self.assertIn("TEHRI_FRL_BREACH", scenarios)
        self.assertIn("TEHRI_MDDL_BREACH", scenarios)
        self.assertIn("TEHRI_SPILLWAY_OPERATION", scenarios)
        self.assertIn("TEHRI_EXTREME_INFLOW", scenarios)
        self.assertIn("USER_DEFINED", scenarios)

    def test_mandatory_twelve_schema_parameters(self):
        """
        Verifies every scenario defines all 12 required parameters.
        """
        scenarios = self.service.get_all_scenarios()["scenarios"]
        
        required_keys = [
            "reservoir_level_m",
            "initial_storage_mm3",
            "inflow_hydrograph",
            "spillway_operation",
            "breach_occurrence",
            "breach_start_time_hr",
            "breach_bottom_elevation_m",
            "final_breach_width_m",
            "breach_formation_time_hr",
            "breach_side_slopes_hv",
            "downstream_boundary",
            "simulation_duration_hr",
            "assumptions_metadata"
        ]

        for scen_id, scen in scenarios.items():
            for key in required_keys:
                self.assertIn(key, scen, f"Missing key '{key}' in scenario '{scen_id}'")
            
            self.assertIsInstance(scen["breach_occurrence"], bool, f"breach_occurrence must be bool in '{scen_id}'")
            self.assertIsInstance(scen["inflow_hydrograph"], dict)
            self.assertIsInstance(scen["spillway_operation"], dict)
            self.assertIsInstance(scen["assumptions_metadata"], list)
            self.assertGreater(len(scen["assumptions_metadata"]), 0)

    def test_pmf_no_failure_does_not_equate_to_dam_break(self):
        """
        Verifies TEHRI_PMF_NO_FAILURE has breach_occurrence == False and generates 0.0 breach outflow.
        """
        res = self.service.evaluate_scenario_hydrodynamics("TEHRI_PMF_NO_FAILURE")
        self.assertFalse(res["breach_occurrence"])
        self.assertEqual(res["breach_peak_outflow_m3s"], 0.0)
        self.assertGreater(res["total_peak_outflow_m3s"], 0.0)
        self.assertEqual(res["category"], "PMF_NO_FAILURE")

    def test_overtopping_and_breach_scenarios_enable_breach_outflow(self):
        """
        Verifies overtopping and structural breach scenarios have breach_occurrence == True.
        """
        for scen_id in ["TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO", "TEHRI_FRL_BREACH", "TEHRI_MDDL_BREACH"]:
            res = self.service.evaluate_scenario_hydrodynamics(scen_id)
            self.assertTrue(res["breach_occurrence"])
            self.assertGreater(res["breach_peak_outflow_m3s"], 0.0)

    def test_assumptions_metadata_presence(self):
        """
        Verifies every scenario carries explicitly labeled assumptions.
        """
        scenarios = self.service.get_all_scenarios()["scenarios"]
        for scen_id, scen in scenarios.items():
            assumptions = scen["assumptions_metadata"]
            self.assertGreaterEqual(len(assumptions), 2)
            for statement in assumptions:
                self.assertIsInstance(statement, str)
                self.assertGreater(len(statement), 5)

    def test_rest_api_tehri_scenario_endpoints(self):
        """
        Verifies REST API endpoints /api/scenarios/tehri/catalog, /api/scenarios/tehri/{id}, /api/scenarios/tehri/evaluate.
        """
        # Catalog endpoint
        res_cat = self.client.get("/api/scenarios/tehri/catalog")
        self.assertEqual(res_cat.status_code, 200)
        json_cat = res_cat.json()
        self.assertFalse(json_cat["pmf_equals_dam_break"])
        self.assertEqual(json_cat["total_scenarios"], 7)

        # Single scenario lookup
        res_single = self.client.get("/api/scenarios/tehri/TEHRI_PMF_NO_FAILURE")
        self.assertEqual(res_single.status_code, 200)
        json_single = res_single.json()
        self.assertEqual(json_single["scenario_id"], "TEHRI_PMF_NO_FAILURE")
        self.assertFalse(json_single["breach_occurrence"])

        # Evaluation endpoint
        res_eval = self.client.post("/api/scenarios/tehri/evaluate", json={"scenario_id": "TEHRI_FRL_BREACH"})
        self.assertEqual(res_eval.status_code, 200)
        json_eval = res_eval.json()
        self.assertTrue(json_eval["breach_occurrence"])
        self.assertGreater(json_eval["total_peak_outflow_m3s"], 100000.0)


if __name__ == "__main__":
    unittest.main()
