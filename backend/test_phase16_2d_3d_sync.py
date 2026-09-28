"""
backend/test_phase16_2d_3d_sync.py

Automated Test Suite for Phase 16 — 2D and 3D Synchronization.
Verifies:
1. Single Control State Identity (scenario_id, run_id, simulation_time_min, model_id).
2. Timeline Synchronization (T+45 in 2D == T+45 in 3D).
3. Scenario Parameter Synchronization (updating breach parameters alters both 2D & 3D).
4. Model Selector Synchronization across FloodHADR SWE, FloodHADR DWE, HEC-RAS SWE, HEC-RAS DWE.
5. Bidirectional Asset Selection & Highlighting (2D click -> 3D camera/highlight, 3D click -> 2D map center).
6. REST API Endpoints (/api/gis/sync/*).
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.gis.sync_service import Synchronized2D3DService


class TestPhase162D3DSync(unittest.TestCase):

    def setUp(self):
        self.sync_service = Synchronized2D3DService()
        self.client = TestClient(app)

    def test_01_single_control_state_identity(self):
        """Verify single control state governs both 2D and 3D views."""
        views = self.sync_service.get_synchronized_views()
        control = views["control_state"]

        self.assertIn("scenario_id", control)
        self.assertIn("run_id", control)
        self.assertIn("simulation_time_min", control)
        self.assertIn("model_id", control)

        # Check parameter identity between 2D and 3D
        self.assertEqual(views["view_2d"]["timeline_min"], control["simulation_time_min"])
        self.assertEqual(views["view_3d"]["time_step_min"], control["simulation_time_min"])
        self.assertEqual(views["view_2d"]["model_name"], control["model_id"])
        self.assertEqual(views["view_3d"]["model_selected"], control["model_id"])

    def test_02_timeline_synchronization_t45(self):
        """Verify updating timeline to T+45 minutes updates both 2D and 3D synchronously."""
        views = self.sync_service.set_timeline(45)
        control = views["control_state"]

        self.assertEqual(control["simulation_time_min"], 45)
        self.assertEqual(control["time_display"], "T+45m")
        self.assertEqual(views["view_2d"]["timeline_min"], 45)
        self.assertEqual(views["view_3d"]["time_step_min"], 45)

    def test_03_scenario_synchronization(self):
        """Verify changing scenario parameters updates both 2D and 3D views."""
        views = self.sync_service.set_scenario(
            scenario_id="scen-tehri-overtop-v2",
            params={"breach_width_m": 240.0, "reservoir_level_m": 835.0}
        )
        control = views["control_state"]

        self.assertEqual(control["scenario_id"], "scen-tehri-overtop-v2")
        self.assertGreater(views["view_2d"]["hydraulic_summary"]["max_depth_m"], 0.0)
        self.assertGreater(views["view_3d"]["simulation_frame"]["max_depth_m"], 0.0)

    def test_04_model_selector_synchronization(self):
        """Verify changing active model updates both 2D and 3D views simultaneously."""
        models = ["FloodHADR SWE", "FloodHADR DWE", "HEC-RAS SWE", "HEC-RAS DWE"]

        for m in models:
            views = self.sync_service.set_model(m)
            control = views["control_state"]

            self.assertEqual(control["model_id"], m)
            self.assertEqual(views["view_2d"]["model_name"], m)
            self.assertEqual(views["view_3d"]["model_selected"], m)

    def test_05_bidirectional_asset_selection(self):
        """Verify clicking asset in 2D highlights 3D, and clicking asset in 3D highlights 2D."""
        # 1. Click Asset in 2D -> Highlight 3D
        views_2d_select = self.sync_service.select_asset("bldg-emergency-01", source="2D")
        control_2d = views_2d_select["control_state"]

        self.assertEqual(control_2d["selected_asset_id"], "bldg-emergency-01")
        self.assertEqual(control_2d["highlighted_asset_name"], "Tehri HADR Emergency Command Center")
        self.assertEqual(control_2d["highlighted_location"]["selection_source"], "2D")
        self.assertEqual(control_2d["highlighted_location"]["lat"], 30.3710)

        # 2. Click Asset in 3D -> Highlight 2D
        views_3d_select = self.sync_service.select_asset("br-tehri-suspension", source="3D")
        control_3d = views_3d_select["control_state"]

        self.assertEqual(control_3d["selected_asset_id"], "br-tehri-suspension")
        self.assertEqual(control_3d["highlighted_asset_name"], "Tehri Suspension Bridge")
        self.assertEqual(control_3d["highlighted_location"]["selection_source"], "3D")
        self.assertEqual(control_3d["highlighted_location"]["lat"], 30.3730)

    def test_06_rest_api_sync_endpoints(self):
        """Test REST API GET & POST endpoints for 2D/3D synchronization."""
        # GET /api/gis/sync
        get_res = self.client.get("/api/gis/sync")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["sync_status"], "SYNCHRONIZED")

        # POST /api/gis/sync/timeline
        tl_res = self.client.post("/api/gis/sync/timeline", json={"time_step_min": 45})
        self.assertEqual(tl_res.status_code, 200)
        self.assertEqual(tl_res.json()["control_state"]["simulation_time_min"], 45)

        # POST /api/gis/sync/model
        m_res = self.client.post("/api/gis/sync/model", json={"model_name": "HEC-RAS SWE"})
        self.assertEqual(m_res.status_code, 200)
        self.assertEqual(m_res.json()["control_state"]["model_id"], "HEC-RAS SWE")

        # POST /api/gis/sync/select-asset
        asset_res = self.client.post("/api/gis/sync/select-asset", json={
            "asset_id": "bldg-hospital-01",
            "source": "3D"
        })
        self.assertEqual(asset_res.status_code, 200)
        self.assertEqual(asset_res.json()["control_state"]["selected_asset_id"], "bldg-hospital-01")


if __name__ == "__main__":
    unittest.main()
