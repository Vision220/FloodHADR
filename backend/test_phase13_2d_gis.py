"""
Phase 13 - 2D Flood GIS Upgrade Test Suite
Validates 17 mandatory GIS map layers manifest, dynamic SimulationFrame consumption,
timeline step changes (T+0 to T+360), model selector integration (FloodHADR SWE/DWE, HEC-RAS SWE/DWE),
no-static-polygon dynamic rendering, HADR & bridge features, and REST API endpoints.
"""

import os
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.gis.gis_2d_service import GIS2DLayerService


class TestPhase132DFloodGIS(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.gis_service = GIS2DLayerService()

    def test_01_gis_layers_manifest_17_layers(self):
        """Verify layer manifest lists all 17 mandatory 2D GIS layers."""
        manifest = self.gis_service.get_layer_manifest()

        self.assertEqual(manifest["total_layers"], 17)
        layer_ids = [l["id"] for l in manifest["layers"]]

        required_17_layers = [
            "terrain",
            "river",
            "reservoir",
            "dam",
            "depth",
            "velocity",
            "arrival_time",
            "flood_duration",
            "flow_direction",
            "infrastructure",
            "roads",
            "bridges",
            "population",
            "hadr",
            "floodhadr_result",
            "hecras_result",
            "difference_map"
        ]
        for req_id in required_17_layers:
            self.assertIn(req_id, layer_ids, f"Missing required layer: {req_id}")

    def test_02_simulation_frame_dynamic_consumption(self):
        """Verify changing timeline step dynamically alters displayed hydraulic state."""
        frame_t0 = self.gis_service.get_simulation_frame_gis_data(time_step_min=0)
        frame_t30 = self.gis_service.get_simulation_frame_gis_data(time_step_min=30)
        frame_t180 = self.gis_service.get_simulation_frame_gis_data(time_step_min=180)

        # Hydraulic state must change over timeline steps
        self.assertEqual(frame_t0["hydraulic_summary"]["max_depth_m"], 0.1)
        self.assertGreater(frame_t30["hydraulic_summary"]["max_depth_m"], 0.0)
        self.assertGreater(frame_t180["hydraulic_summary"]["max_depth_m"], frame_t30["hydraulic_summary"]["max_depth_m"])
        self.assertGreater(frame_t180["hydraulic_summary"]["flooded_area_km2"], frame_t30["hydraulic_summary"]["flooded_area_km2"])

    def test_03_model_selector_integration(self):
        """Verify model selector switches output features across SWE and DWE models."""
        fh_swe = self.gis_service.get_simulation_frame_gis_data(model_name="FloodHADR SWE", time_step_min=60)
        fh_dwe = self.gis_service.get_simulation_frame_gis_data(model_name="FloodHADR DWE", time_step_min=60)
        hr_swe = self.gis_service.get_simulation_frame_gis_data(model_name="HEC-RAS SWE", time_step_min=60)

        self.assertEqual(fh_swe["model_name"], "FloodHADR SWE")
        self.assertEqual(fh_dwe["model_name"], "FloodHADR DWE")
        self.assertEqual(hr_swe["model_name"], "HEC-RAS SWE")

        # DWE model should reflect solver difference in velocity / depth
        self.assertLess(fh_dwe["hydraulic_summary"]["max_depth_m"], fh_swe["hydraulic_summary"]["max_depth_m"])

    def test_04_no_static_flood_polygon(self):
        """Verify T+0 returns 0 depth features, proving dynamic frame rendering rather than static polygon."""
        frame_t0 = self.gis_service.get_simulation_frame_gis_data(time_step_min=0)
        depth_features = frame_t0["layers"]["depth"]["features"]
        self.assertEqual(len(depth_features), 0, "T+0 must have 0 flooded features (not static polygon)")

    def test_05_hadr_and_bridge_layer_features(self):
        """Verify HADR relief layers and Bridge crossings are populated with attributes."""
        frame = self.gis_service.get_simulation_frame_gis_data(time_step_min=60)

        bridges = frame["layers"]["bridges"]["features"]
        self.assertGreaterEqual(len(bridges), 2)
        bridge_names = [b["properties"]["name"] for b in bridges]
        self.assertIn("Koteshwar Dam Spillway Bridge", bridge_names)

        hadr_features = frame["layers"]["hadr"]["features"]
        self.assertGreaterEqual(len(hadr_features), 3)
        hadr_types = [h["properties"]["hadr_type"] for h in hadr_features]
        self.assertIn("Relief Shelter", hadr_types)
        self.assertIn("Evacuation Route", hadr_types)

    def test_06_rest_api_gis_endpoints(self):
        """Test REST API GET /api/gis/layers and POST /api/gis/frames."""
        # Manifest GET
        response_manifest = self.client.get("/api/gis/layers")
        self.assertEqual(response_manifest.status_code, 200)
        manifest_data = response_manifest.json()
        self.assertEqual(manifest_data["total_layers"], 17)

        # Frame POST
        payload = {
            "model_name": "HEC-RAS SWE",
            "time_step_min": 60,
            "breach_width_m": 180.0,
            "reservoir_level_m": 830.0
        }
        response_frame = self.client.post("/api/gis/frames", json=payload)
        self.assertEqual(response_frame.status_code, 200)
        frame_data = response_frame.json()

        self.assertEqual(frame_data["status"], "success")
        self.assertEqual(frame_data["model_name"], "HEC-RAS SWE")
        self.assertEqual(frame_data["timeline_min"], 60)
        self.assertIn("layers", frame_data)


if __name__ == "__main__":
    unittest.main()
