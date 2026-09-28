"""
backend/test_phase15_dynamic_3d.py

Automated Test Suite for Phase 15 — Dynamic 3D Flood Visualization.
Verifies:
1. Fundamental Hydraulic Identity: WSE(r, c) = Terrain_Elevation(r, c) + Water_Depth(r, c).
2. Dynamic Timestep Updating across all 6 flood indicators & phases (Arrival, Expansion, Max Depth, Recession, Velocity Field, WSE).
3. Non-static blue plane (cell-by-cell non-uniform depth matrix).
4. Parameter responsiveness (Changing breach width / reservoir level alters 3D flood surface).
5. Model switcher integration across FloodHADR SWE, FloodHADR DWE, HEC-RAS SWE, HEC-RAS DWE.
6. REST API endpoint responses (/api/gis/3d-scene).
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.gis.digital_twin_3d_service import DigitalTwin3DService


class TestPhase15Dynamic3DFlood(unittest.TestCase):

    def setUp(self):
        self.service = DigitalTwin3DService()
        self.client = TestClient(app)

    def test_fundamental_wse_identity_equation(self):
        """Verify WSE(r, c) == Terrain_Elevation(r, c) + Water_Depth(r, c) for all cells."""
        scene = self.service.get_3d_scene_data(model_name="FloodHADR SWE", time_step_min=60)
        elements = scene["required_3d_elements"]

        dem = elements["downstream_terrain"]["elevation_matrix"]
        sim_frame = scene["simulation_frame"]

        wse_matrix = sim_frame["water_surface_elevation"]
        depth_matrix = sim_frame["water_depth"]

        for r in range(30):
            for c in range(30):
                expected_wse = round(dem[r][c] + depth_matrix[r][c], 2)
                actual_wse = wse_matrix[r][c]
                self.assertAlmostEqual(actual_wse, expected_wse, places=2,
                                       msg=f"WSE equation failed at cell ({r},{c})")

    def test_dynamic_hydrograph_phases_and_recession(self):
        """Verify 3D flood updates dynamically through Arrival, Expansion, Max Depth, and Recession."""
        # 1. Arrival Phase (T+10)
        scene_t10 = self.service.get_3d_scene_data(time_step_min=10)
        self.assertEqual(scene_t10["simulation_frame"]["flood_phase"], "FLOOD_ARRIVAL")

        # 2. Expansion Phase (T+60)
        scene_t60 = self.service.get_3d_scene_data(time_step_min=60)
        self.assertEqual(scene_t60["simulation_frame"]["flood_phase"], "FLOOD_EXPANSION")

        # 3. Maximum Depth Phase (T+180 - Peak Flood)
        scene_t180 = self.service.get_3d_scene_data(time_step_min=180)
        self.assertEqual(scene_t180["simulation_frame"]["flood_phase"], "MAXIMUM_DEPTH")

        # 4. Recession Phase (T+240)
        scene_t240 = self.service.get_3d_scene_data(time_step_min=240)
        self.assertEqual(scene_t240["simulation_frame"]["flood_phase"], "FLOOD_RECESSION")

        # Verify depth recedes after peak (T+240 < T+180)
        self.assertLess(scene_t240["simulation_frame"]["max_depth_m"],
                        scene_t180["simulation_frame"]["max_depth_m"])

    def test_no_static_blue_plane_non_uniform_depth(self):
        """Verify water surface is cell-by-cell non-uniform (not a flat static plane)."""
        scene = self.service.get_3d_scene_data(time_step_min=60)
        depth_matrix = scene["simulation_frame"]["water_depth"]

        # Collect unique non-zero depth values to prove depth variation
        depth_values = set()
        for r in range(30):
            for c in range(30):
                if depth_matrix[r][c] > 0.0:
                    depth_values.add(depth_matrix[r][c])

        self.assertGreater(len(depth_values), 1, "Water depth must vary across grid cells (not a flat plane)")

    def test_parameter_responsiveness_breach_and_level(self):
        """Verify changing breach width or reservoir level alters 3D flood depth and area."""
        base_scene = self.service.get_3d_scene_data(
            time_step_min=60,
            scenario_params={"breach_width_m": 100.0, "reservoir_level_m": 800.0}
        )
        larger_scene = self.service.get_3d_scene_data(
            time_step_min=60,
            scenario_params={"breach_width_m": 300.0, "reservoir_level_m": 830.0}
        )

        base_depth = base_scene["simulation_frame"]["max_depth_m"]
        larger_depth = larger_scene["simulation_frame"]["max_depth_m"]

        self.assertGreater(larger_depth, base_depth,
                           "Increasing breach width & level must increase 3D max depth")

    def test_model_switcher_all_four_models(self):
        """Verify 3D scene switches between FloodHADR SWE, FloodHADR DWE, HEC-RAS SWE, HEC-RAS DWE."""
        models = ["FloodHADR SWE", "FloodHADR DWE", "HEC-RAS SWE", "HEC-RAS DWE"]

        for m in models:
            scene = self.service.get_3d_scene_data(model_name=m, time_step_min=60)
            self.assertEqual(scene["model_selected"], m)
            self.assertIn("max_depth_m", scene["simulation_frame"])
            self.assertIn("velocity", scene["simulation_frame"])

    def test_api_3d_scene_endpoint_dynamic(self):
        """Test POST /api/gis/3d-scene with dynamic parameters."""
        res = self.client.post("/api/gis/3d-scene", json={
            "model_name": "FloodHADR SWE",
            "time_step_min": 120,
            "breach_width_m": 220.0,
            "reservoir_level_m": 835.0
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        sim_frame = data["simulation_frame"]

        self.assertEqual(sim_frame["flood_phase"], "MAXIMUM_DEPTH")
        self.assertGreater(sim_frame["max_depth_m"], 0.0)
        self.assertIn("water_surface_elevation", sim_frame)


if __name__ == "__main__":
    unittest.main()
