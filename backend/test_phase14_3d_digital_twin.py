"""
backend/test_phase14_3d_digital_twin.py

Automated Test Suite for Phase 14 — Real 3D Digital Twin.
Verifies:
1. Three.js is strictly a visualization renderer consuming backend `SimulationFrame` (no separate Three.js simulation).
2. Identity binding across DEM, CRS (EPSG:32644), scenario, SimulationFrame, dam, reservoir, river, infrastructure.
3. 100% presence of all 9 required 3D elements (Dam, Reservoir, River, Terrain, Roads, Bridges, Buildings, Critical Infra, Flood Water).
4. Explicit DEMO labeling for synthetic objects.
5. REST API endpoint responses (/gis/3d-manifest, /gis/3d-scene).
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.gis.digital_twin_3d_service import DigitalTwin3DService


class TestPhase143DDigitalTwin(unittest.TestCase):

    def setUp(self):
        self.service = DigitalTwin3DService()
        self.client = TestClient(app)

    def test_3d_manifest(self):
        manifest = self.service.get_3d_scene_manifest()
        self.assertEqual(manifest["crs"], "EPSG:32644")
        self.assertIn("DISABLED", manifest["threejs_simulation_status"])
        self.assertEqual(manifest["synthetic_object_label"], "DEMO")
        self.assertEqual(len(manifest["required_elements_checklist"]), 9)

    def test_3d_scene_data_parameter_identity(self):
        scene = self.service.get_3d_scene_data(
            model_name="FloodHADR SWE",
            time_step_min=30,
            scenario_params={"breach_width_m": 180.0, "reservoir_level_m": 830.0}
        )

        # 1. Parameter Identity
        self.assertEqual(scene["crs"], "EPSG:32644")
        self.assertEqual(scene["dem_version"], "ALOS_PALSAR_12M_REAL")
        self.assertEqual(scene["scenario"]["breach_width_m"], 180.0)
        self.assertEqual(scene["scenario"]["reservoir_level_m"], 830.0)
        self.assertTrue(scene["no_separate_threejs_simulation"])

        # 2. SimulationFrame Consumption
        sim_frame = scene["simulation_frame"]
        self.assertIn("water_depth", sim_frame)
        self.assertIn("velocity", sim_frame)
        self.assertGreaterEqual(sim_frame["max_depth_m"], 0.0)

    def test_required_3d_elements_checklist(self):
        scene = self.service.get_3d_scene_data(model_name="FloodHADR SWE", time_step_min=60)
        elements = scene["required_3d_elements"]

        # Check all 9 required elements
        self.assertIn("tehri_dam", elements)
        self.assertIn("tehri_reservoir", elements)
        self.assertIn("bhagirathi_river", elements)
        self.assertIn("downstream_terrain", elements)
        self.assertIn("roads", elements)
        self.assertIn("bridges", elements)
        self.assertIn("buildings", elements)
        self.assertIn("critical_infrastructure", elements)
        self.assertIn("flood_water", elements)

        # Dam Details
        dam = elements["tehri_dam"]
        self.assertEqual(dam["height_m"], 260.5)
        self.assertEqual(dam["lat"], 30.3781)
        self.assertEqual(dam["lng"], 78.4802)

        # Terrain Matrix
        terrain = elements["downstream_terrain"]
        self.assertGreater(terrain["rows"], 0)
        self.assertGreater(terrain["cols"], 0)

        # Flood Water Mesh configuration
        flood_water = elements["flood_water"]
        self.assertEqual(flood_water["source"], "SIMULATION_FRAME")
        self.assertTrue(flood_water["no_separate_threejs_simulation"])

    def test_synthetic_objects_labelled_demo(self):
        scene = self.service.get_3d_scene_data(model_name="FloodHADR SWE", time_step_min=30)
        self.assertTrue(scene["synthetic_objects_labelled"])
        self.assertEqual(scene["synthetic_label_tag"], "DEMO")

        elements = scene["required_3d_elements"]

        # Verify roads carry DEMO label
        for road in elements["roads"]:
            if road["is_synthetic"]:
                self.assertEqual(road["label"], "DEMO")
                self.assertEqual(road["provenance"], "DEMO")

        # Verify bridges carry DEMO label
        for bridge in elements["bridges"]:
            if bridge["is_synthetic"]:
                self.assertEqual(bridge["label"], "DEMO")
                self.assertEqual(bridge["provenance"], "DEMO")

        # Verify buildings carry DEMO label
        for bldg in elements["buildings"]:
            if bldg["is_synthetic"]:
                self.assertEqual(bldg["label"], "DEMO")
                self.assertEqual(bldg["provenance"], "DEMO")

    def test_api_3d_endpoints(self):
        # GET /api/gis/3d-manifest
        manifest_res = self.client.get("/api/gis/3d-manifest")
        self.assertEqual(manifest_res.status_code, 200)
        manifest_data = manifest_res.json()
        self.assertEqual(manifest_data["crs"], "EPSG:32644")

        # POST /api/gis/3d-scene
        scene_res = self.client.post("/api/gis/3d-scene", json={
            "model_name": "FloodHADR SWE",
            "time_step_min": 30,
            "breach_width_m": 200.0,
            "reservoir_level_m": 830.0
        })
        self.assertEqual(scene_res.status_code, 200)
        scene_data = scene_res.json()
        self.assertTrue(scene_data["no_separate_threejs_simulation"])
        self.assertEqual(scene_data["scenario"]["breach_width_m"], 200.0)


if __name__ == "__main__":
    unittest.main()
