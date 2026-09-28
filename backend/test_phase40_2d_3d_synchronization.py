"""
backend/test_phase40_2d_3d_synchronization.py

Automated Test Suite for PHASE 40 — FINAL 2D AND 3D SYNCHRONIZATION.

Verifies:
1. At identical simulation time, 2D and 3D represent 100% identical hydraulic state.
2. Select location in 2D -> 3D camera moves to corresponding 3D world position.
3. Select 3D asset -> 2D map centers on corresponding geographical lat/lng.
4. Time stepping progression across T+0, T+1h, T+2h, T+4h, T+6h updates 2D boundary, 3D WSE, depth, velocity, arrival status, and asset status.
5. Mandate enforcement: NO independent 3D simulation allowed (no_separate_threejs_simulation == True).
6. REST API synchronization endpoints.
"""

import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.gis.sync_service import Synchronized2D3DService


class TestPhase40Synchronization(unittest.TestCase):

    def setUp(self):
        self.service = Synchronized2D3DService()
        self.client = TestClient(app)

    def test_01_identical_hydraulic_state(self):
        """Verify that at identical simulation time, 2D and 3D represent the exact same hydraulic state."""
        self.service.set_timeline(60)
        views = self.service.get_synchronized_views()

        self.assertEqual(views["sync_status"], "SYNCHRONIZED")
        self.assertTrue(views["hydraulic_identity_verified"])

        v2d = views["view_2d"]["hydraulic_summary"]
        v3d = views["view_3d"]["simulation_frame"]

        self.assertEqual(v2d["max_depth_m"], v3d["max_depth_m"])
        self.assertEqual(v2d["max_velocity_ms"], v3d["max_velocity_ms"])
        self.assertEqual(v2d["flooded_area_km2"], v3d["flooded_area_km2"])

    def test_02_2d_location_selection_camera_mapping(self):
        """Select a location in 2D -> Verify 3D camera position and target move to identical 3D world position."""
        target_lat = 30.3710
        target_lng = 78.4740
        elev = 720.0

        views = self.service.select_2d_location(target_lat, target_lng, elev)

        control = views["control_state"]
        location = control["highlighted_location"]
        camera = control["camera_3d"]

        self.assertEqual(location["lat"], target_lat)
        self.assertEqual(location["lng"], target_lng)
        self.assertEqual(location["selection_source"], "2D_MAP")

        # Check world coordinate calculation
        world_x = round((target_lng - 78.4802) * 95780.0, 2)
        world_z = round((30.3781 - target_lat) * 111000.0, 2)

        self.assertAlmostEqual(camera["target"][0], world_x, delta=0.5)
        self.assertAlmostEqual(camera["target"][2], world_z, delta=0.5)

    def test_03_3d_asset_selection_2d_center(self):
        """Select a 3D asset -> Verify 2D map centers on corresponding geographical lat/lng."""
        asset_id = "bldg-hospital-01"
        views = self.service.select_3d_asset(asset_id)

        control = views["control_state"]
        map_2d = control["map_2d"]
        location = control["highlighted_location"]

        self.assertEqual(control["selected_asset_id"], asset_id)
        self.assertEqual(location["selection_source"], "3D_SCENE")
        self.assertEqual(map_2d["center_lat"], 30.3680)
        self.assertEqual(map_2d["center_lng"], 78.4720)

    def test_04_time_stepping_progression_audit(self):
        """Verify time stepping across T+0, T+1h, T+2h, T+4h, T+6h updates all hydraulic & asset metrics."""
        audit = self.service.audit_time_series_progression([0, 60, 120, 240, 360])

        self.assertEqual(audit["status"], "PHASE_40_TIME_SERIES_AUDIT_COMPLETE")
        summary = audit["audit_summary"]

        self.assertTrue(summary["identity_verified_all_timesteps"])
        self.assertTrue(summary["flood_boundary_dynamic"])
        self.assertTrue(summary["depth_dynamic"])
        self.assertTrue(summary["velocity_dynamic"])
        self.assertTrue(summary["no_independent_3d_simulation"])
        self.assertTrue(summary["pass_condition"])

        records = audit["records"]
        self.assertEqual(len(records), 5)
        labels = [r["label"] for r in records]
        self.assertEqual(labels, ["T+0m", "T+1h", "T+2h", "T+4h", "T+6h"])

        # Check depth and area increase then peak
        self.assertLess(records[0]["flooded_area_km2"], records[2]["flooded_area_km2"])
        self.assertGreater(records[2]["max_depth_m"], records[0]["max_depth_m"])

    def test_05_mandate_enforcement_no_independent_3d_sim(self):
        """Verify mandate enforcement: 3D is strictly a renderer for backend hydraulic simulation state."""
        views = self.service.get_synchronized_views()
        self.assertTrue(views["view_3d"]["no_separate_threejs_simulation"])

    def test_06_rest_api_sync_endpoints(self):
        """Test GET /gis/sync, POST /gis/sync/select-location, POST /gis/sync/select-3d-asset, and GET /gis/sync/time-series-audit REST endpoints."""
        # 1. GET master sync state
        r1 = self.client.get("/api/gis/sync")
        self.assertEqual(r1.status_code, 200)
        self.assertTrue(r1.json()["hydraulic_identity_verified"])

        # 2. POST select 2D location
        r2 = self.client.post("/api/gis/sync/select-location", json={"lat": 30.3710, "lng": 78.4740, "elevation_m": 720.0})
        self.assertEqual(r2.status_code, 200)
        data2 = r2.json()
        self.assertEqual(data2["control_state"]["highlighted_location"]["selection_source"], "2D_MAP")

        # 3. POST select 3D asset
        r3 = self.client.post("/api/gis/sync/select-3d-asset", json={"asset_id": "bldg-emergency-01"})
        self.assertEqual(r3.status_code, 200)
        data3 = r3.json()
        self.assertEqual(data3["control_state"]["selected_asset_id"], "bldg-emergency-01")

        # 4. GET time-series audit
        r4 = self.client.get("/api/gis/sync/time-series-audit")
        self.assertEqual(r4.status_code, 200)
        data4 = r4.json()
        self.assertTrue(data4["audit_summary"]["pass_condition"])


if __name__ == "__main__":
    unittest.main()
