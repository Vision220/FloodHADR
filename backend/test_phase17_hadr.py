"""
backend/test_phase17_hadr.py

Automated Test Suite for Phase 17 — Infrastructure Impact & HADR Decision Support.
Verifies:
1. No duplicate flood model inside HADR (consumes hydraulic solver outputs directly).
2. Calculation of all 14 mandatory asset fields:
   asset_id, asset_type, location, ground_elevation, maximum_depth, maximum_velocity,
   arrival_time, flood_duration, hazard, accessibility, scenario_id, run_id, model, provenance.
3. Coverage of all 10 supported asset categories (settlements, roads, bridges, hospitals,
   schools, police, fire/rescue, power, administrative buildings, evacuation facilities).
4. Generation of all 7 required HADR decision outputs (affected_infrastructure, potentially_blocked_roads,
   critical_assets, warning_time, evacuation_routes, safe_zones, scenario_impact_comparison).
5. Synthetic infrastructure DEMO labeling rules.
6. REST API endpoints GET /api/gis/hadr/impact & POST /api/gis/hadr/impact.
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.gis.hadr_service import HADRImpactService


class TestPhase17HADRImpact(unittest.TestCase):

    def setUp(self):
        self.hadr_service = HADRImpactService()
        self.client = TestClient(app)

    def test_01_no_duplicate_flood_model_consumes_hydraulics(self):
        """Verify HADR service consumes hydraulic solver outputs without re-simulating."""
        eval_res = self.hadr_service.evaluate_hadr_impact(
            model_name="FloodHADR SWE",
            time_step_min=60,
            scenario_params={"breach_width_m": 180.0, "reservoir_level_m": 830.0}
        )

        self.assertEqual(eval_res["hadr_status"], "COMPUTED_FROM_HYDRAULICS")
        self.assertTrue(eval_res["no_separate_hadr_flood_model"])
        self.assertEqual(eval_res["model_used"], "FloodHADR SWE")

    def test_02_all_14_mandatory_asset_fields_calculated(self):
        """Verify every evaluated asset contains all 14 mandatory calculation fields."""
        eval_res = self.hadr_service.evaluate_hadr_impact()
        assets = eval_res["outputs"]["affected_infrastructure"]

        mandatory_fields = [
            "asset_id",
            "asset_type",
            "location",
            "ground_elevation",
            "maximum_depth",
            "maximum_velocity",
            "arrival_time",
            "flood_duration",
            "hazard",
            "accessibility",
            "scenario_id",
            "run_id",
            "model",
            "provenance"
        ]

        self.assertGreater(len(assets), 0)

        for asset in assets:
            for f in mandatory_fields:
                self.assertIn(f, asset, f"Asset {asset.get('asset_id')} missing mandatory field: {f}")

            # Location location coordinates check
            loc = asset["location"]
            self.assertIn("lat", loc)
            self.assertIn("lng", loc)
            self.assertIn("world_x", loc)
            self.assertIn("world_z", loc)

            # Enforce enum values
            self.assertIn(asset["hazard"], ["LOW", "MODERATE", "HIGH", "SEVERE"])
            self.assertIn(asset["accessibility"], ["ACCESSIBLE", "RESTRICTED", "BLOCKED"])

    def test_03_all_10_supported_asset_categories_present(self):
        """Verify all 10 supported asset categories are present in the HADR evaluation."""
        eval_res = self.hadr_service.evaluate_hadr_impact()
        assets = eval_res["outputs"]["affected_infrastructure"]
        asset_types = set(a["asset_type"] for a in assets)

        required_10_categories = [
            "settlements",
            "roads",
            "bridges",
            "hospitals",
            "schools",
            "police",
            "fire/rescue",
            "power",
            "administrative buildings",
            "evacuation facilities"
        ]

        for req_cat in required_10_categories:
            self.assertIn(req_cat, asset_types, f"Missing required asset category: {req_cat}")

    def test_04_all_7_generated_hadr_outputs_present(self):
        """Verify presence of all 7 required HADR decision support outputs."""
        eval_res = self.hadr_service.evaluate_hadr_impact()
        outputs = eval_res["outputs"]

        required_7_outputs = [
            "affected_infrastructure",
            "potentially_blocked_roads",
            "critical_assets",
            "warning_time",
            "evacuation_routes",
            "safe_zones",
            "scenario_impact_comparison"
        ]

        for req_out in required_7_outputs:
            self.assertIn(req_out, outputs, f"Missing required HADR output: {req_out}")

        # Check content in outputs
        self.assertGreater(len(outputs["affected_infrastructure"]), 0)
        self.assertGreater(len(outputs["potentially_blocked_roads"]), 0)
        self.assertGreater(len(outputs["critical_assets"]), 0)
        self.assertGreater(len(outputs["warning_time"]), 0)
        self.assertGreater(len(outputs["evacuation_routes"]), 0)
        self.assertGreater(len(outputs["safe_zones"]), 0)
        self.assertIn("current_scenario", outputs["scenario_impact_comparison"])

    def test_05_synthetic_infrastructure_demo_labeling(self):
        """Verify synthetic assets carry provenance='DEMO' and label='DEMO'."""
        eval_res = self.hadr_service.evaluate_hadr_impact()
        assets = eval_res["outputs"]["affected_infrastructure"]

        for asset in assets:
            if asset["is_synthetic_demo"]:
                self.assertEqual(asset["provenance"], "DEMO")
                self.assertEqual(asset["label"], "DEMO")

    def test_06_rest_api_hadr_endpoints(self):
        """Test GET /api/gis/hadr/impact and POST /api/gis/hadr/impact REST endpoints."""
        # GET /api/gis/hadr/impact
        get_res = self.client.get("/api/gis/hadr/impact")
        self.assertEqual(get_res.status_code, 200)
        data_get = get_res.json()
        self.assertEqual(data_get["hadr_status"], "COMPUTED_FROM_HYDRAULICS")

        # POST /api/gis/hadr/impact
        post_res = self.client.post("/api/gis/hadr/impact", json={
            "model_name": "HEC-RAS SWE",
            "time_step_min": 120,
            "scenario_id": "scen-tehri-overtop-custom",
            "run_id": "sim-2026-custom",
            "breach_width_m": 220.0,
            "reservoir_level_m": 835.0
        })
        self.assertEqual(post_res.status_code, 200)
        data_post = post_res.json()
        self.assertEqual(data_post["model_used"], "HEC-RAS SWE")
        self.assertEqual(data_post["scenario_id"], "scen-tehri-overtop-custom")
        self.assertIn("affected_infrastructure", data_post["outputs"])


if __name__ == "__main__":
    unittest.main()
