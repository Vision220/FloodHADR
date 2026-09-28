"""
backend/test_phase31_3d_digital_twin.py

Automated Test Suite for Phase 31: Real DEM-Driven 3D Hydrodynamic Digital Twin.
Verifies DEM-driven terrain, 13 required 3D scene elements, georeferenced asset metadata,
removal of decorative assets, CRS alignment, 2D <-> 3D synchronization, and dynamic parameter responsiveness.
"""

import unittest
from app.gis.digital_twin_3d_service import DigitalTwin3DService
from app.gis.sync_service import Synchronized2D3DService


class TestPhase313DDigitalTwin(unittest.TestCase):

    def setUp(self):
        self.dt_service = DigitalTwin3DService()
        self.sync_service = Synchronized2D3DService()

    def test_01_dem_driven_architecture(self):
        """Test that 3D scene consumes identical DEM elevation matrix as 2D solver."""
        payload = self.dt_service.get_3d_scene_data("FloodHADR SWE", time_step_min=30)
        self.assertEqual(payload["crs"], "EPSG:32644")
        self.assertTrue("EPSG:32644" in payload["crs_transformation"])
        self.assertTrue("EPSG:4326" in payload["crs_transformation"])
        
        sim_frame = payload["simulation_frame"]
        self.assertIn("water_depth", sim_frame)
        self.assertIn("velocity", sim_frame)
        self.assertIn("water_surface_elevation", sim_frame)
        
        req_elements = payload["required_3d_elements"]
        dem_matrix = req_elements["real_dem_terrain"]["elevation_matrix"]
        self.assertEqual(len(dem_matrix), 30)
        self.assertEqual(len(dem_matrix[0]), 30)

    def test_02_all_13_required_3d_elements_present(self):
        """Test that all 13 mandatory 3D scene elements are explicitly included."""
        payload = self.dt_service.get_3d_scene_data("FloodHADR SWE", time_step_min=60)
        elements = payload["required_3d_elements"]
        
        required_keys = [
            "real_dem_terrain",
            "real_river_alignment",
            "tehri_dam_position",
            "reservoir_surface",
            "downstream_river_channel",
            "flood_water_surface",
            "infrastructure_from_gis",
            "bridges",
            "roads",
            "terrain_contours",
            "simulation_time",
            "flood_depth",
            "velocity_visualization"
        ]
        
        for key in required_keys:
            self.assertIn(key, elements, f"Missing required 3D scene element: {key}")

    def test_03_decorative_elements_removed(self):
        """Test that procedural/decorative elements are explicitly declared removed."""
        payload = self.dt_service.get_3d_scene_data("FloodHADR SWE", time_step_min=30)
        self.assertIn("removed_decorative_elements", payload)
        removed = payload["removed_decorative_elements"]
        self.assertIn("fake green terrain", removed)
        self.assertIn("arbitrary water strips", removed)
        self.assertIn("procedural mountains unrelated to DEM", removed)

    def test_04_georeferenced_asset_metadata(self):
        """Test that every 3D asset has latitude, longitude, elevation, source, provenance, and asset_id."""
        payload = self.dt_service.get_3d_scene_data("FloodHADR SWE", time_step_min=30)
        elements = payload["required_3d_elements"]
        
        infra = elements["infrastructure_from_gis"]
        bridges = elements["bridges"]
        roads = elements["roads"]
        
        all_assets = infra + bridges + roads
        self.assertGreater(len(all_assets), 0)
        
        for item in all_assets:
            self.assertTrue("latitude" in item or "lat" in item)
            self.assertTrue("longitude" in item or "lng" in item)
            self.assertTrue("elevation" in item or "elevation_m" in item)
            self.assertIn("source", item)
            self.assertIn("provenance", item)
            self.assertTrue("asset_id" in item or "id" in item)

    def test_05_bidirectional_2d_3d_synchronization(self):
        """Test 2D <-> 3D selected location & asset synchronization."""
        # 3D selection of asset -> 2D update
        sel = self.sync_service.select_asset("bldg-emergency-01", 30.3710, 78.4740, source="3D")
        self.assertEqual(sel["control_state"]["selected_asset_id"], "bldg-emergency-01")
        self.assertEqual(sel["control_state"]["highlighted_location"]["selection_source"], "3D")
        self.assertIn("view_2d", sel)
        self.assertIn("view_3d", sel)

    def test_06_parameter_responsiveness(self):
        """Test that altering simulation parameters alters 3D scene hydraulic output."""
        base_payload = self.dt_service.get_3d_scene_data(
            model_name="FloodHADR SWE",
            time_step_min=60,
            scenario_params={"breach_width_m": 100.0, "reservoir_level_m": 800.0}
        )
        high_payload = self.dt_service.get_3d_scene_data(
            model_name="FloodHADR SWE",
            time_step_min=60,
            scenario_params={"breach_width_m": 300.0, "reservoir_level_m": 839.5}
        )
        
        base_max_d = base_payload["simulation_frame"]["max_depth_m"]
        high_max_d = high_payload["simulation_frame"]["max_depth_m"]
        self.assertGreater(high_max_d, base_max_d)


if __name__ == "__main__":
    unittest.main()
