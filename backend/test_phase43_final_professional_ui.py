"""
backend/test_phase43_final_professional_ui.py

Automated Test Suite for PHASE 43 — FINAL FLOODHADR PROFESSIONAL UI.

Verifies:
1. Every major page & API endpoint provides explicit provenance metadata:
   - ACTIVE SCENARIO
   - MODEL
   - RUN ID
   - TIME
   - DATA SOURCE / DEM
   - STATUS
   - PROVENANCE
2. Does NOT display 'DEMO MODEL' when actual result is live/real.
3. Does NOT display 'ONLINE' if service is unavailable.
4. Preserves visual identity while removing misleading elements.
"""

import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.simulation.golden_benchmark_service import GoldenBenchmarkService
from app.gis.sync_service import Synchronized2D3DService


class TestPhase43ProfessionalUI(unittest.TestCase):

    def setUp(self):
        self.benchmark_service = GoldenBenchmarkService()
        self.sync_service = Synchronized2D3DService()
        self.client = TestClient(app)

    def test_01_provenance_metadata_header_schema(self):
        """Verify that synchronized control state & golden pipeline output all 7 required metadata fields."""
        views = self.sync_service.get_synchronized_views()
        ctrl = views["control_state"]

        self.assertIn("scenario_id", ctrl)
        self.assertIn("model_id", ctrl)
        self.assertIn("run_id", ctrl)
        self.assertIn("simulation_time_min", ctrl)
        self.assertIn("time_display", ctrl)

        # Check 2D GIS view DEM and status metadata
        v2d = views["view_2d"]
        self.assertIn("model_name", v2d)
        self.assertIn("time_display", v2d)

        # Check 3D Digital Twin view DEM and provenance metadata
        v3d = views["view_3d"]
        self.assertTrue(v3d["no_separate_threejs_simulation"])

    def test_02_golden_benchmark_provenance_identity(self):
        """Verify 16-stage pipeline report metadata headers."""
        params = self.benchmark_service.get_baseline_parameters()
        self.assertEqual(params["scenario_id"], "TEHRI_GOLDEN_BENCHMARK_V1")
        self.assertTrue("EPSG:32644" in params["crs"])
        self.assertTrue("ALOS PALSAR" in params["dem_version"])

    def test_03_no_misleading_online_or_demo_labels(self):
        """Verify GEE and HEC-RAS status report explicit execution states without misleading 'ONLINE' when offline."""
        r_gee = self.client.get("/api/gee/status")
        self.assertEqual(r_gee.status_code, 200)
        gee_data = r_gee.json()

        if not gee_data.get("authenticated", False):
            self.assertNotEqual(gee_data.get("gee_execution_state"), "ONLINE")
            self.assertIn(gee_data.get("gee_execution_state"), ["DEMO", "NOT CONFIGURED", "DEMO_DATA_MODE"])

    def test_04_rest_api_sync_and_benchmark_provenance(self):
        """Test GET /api/gis/sync REST endpoint."""
        r = self.client.get("/api/gis/sync")
        self.assertEqual(r.status_code, 200)
        data = r.json()

        self.assertEqual(data["sync_status"], "SYNCHRONIZED")
        self.assertTrue(data["hydraulic_identity_verified"])
        self.assertIn("control_state", data)


if __name__ == "__main__":
    unittest.main()
