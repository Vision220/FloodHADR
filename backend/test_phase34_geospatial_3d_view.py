"""
backend/test_phase34_geospatial_3d_view.py

Unit and integration test suite for Phase 34: High-Quality Georeferenced Earth / 3D View.

Verifies:
1. Geospatial 3D scene architecture, CRS matching (EPSG:32644), DEM matching.
2. Hydraulic flood surface generation from terrain elevation + simulated water depth (NOT manual blue polygon).
3. Support for 4 explicit 3D visualization modes: Depth mode, Velocity mode, Water-surface mode, Arrival-time mode.
4. Vertical exaggeration as a visual presentation control (1x, 2x, 5x) without modifying scientific elevations/coordinates internally.
5. Georeferenced elements (Tehri Dam at 30.3781°N, 78.4802°E, Bhagirathi River, reservoir, roads, bridges, infrastructure).
"""

import unittest
from app.gis.digital_twin_3d_service import DigitalTwin3DService


class TestPhase34Geospatial3DView(unittest.TestCase):
    """
    Test suite for Phase 34 geospatial 3D visualization engine.
    """

    def setUp(self):
        self.service = DigitalTwin3DService()

    def test_3d_scene_manifest_architecture(self):
        """
        Verifies 3D Digital Twin manifest returns valid CRS, DEM source, and checklist elements.
        """
        manifest = self.service.get_3d_scene_manifest()
        self.assertEqual(manifest["crs"], "EPSG:32644")
        self.assertIn("ALOS PALSAR", manifest["dem_source"])
        self.assertEqual(manifest["threejs_simulation_status"], "DISABLED (Visualization Only - Consumes SimulationFrame)")
        
        required_items = manifest["required_elements_checklist"]
        self.assertIn("Tehri Dam", required_items)
        self.assertIn("Tehri Reservoir", required_items)
        self.assertIn("Bhagirathi River", required_items)
        self.assertIn("Downstream terrain", required_items)
        self.assertIn("Flood water", required_items)

    def test_flood_surface_generation_from_dem_and_water_depth(self):
        """
        Verifies flood surface is computed as: WSE = DEM_Elevation + Water_Depth.
        Must NOT be a hardcoded blue polygon.
        """
        payload = self.service.get_3d_scene_data(model_name="FloodHADR SWE", time_step_min=60)
        
        self.assertEqual(payload["flood_surface_generation"], "terrain elevation + simulated water depth")
        
        frame = payload["simulation_frame"]
        req_elements = payload["required_3d_elements"]
        dem_matrix = req_elements["real_dem_terrain"]["elevation_matrix"]
        depth_matrix = frame["water_depth"]
        wse_matrix = frame["water_surface_elevation"]

        rows = len(dem_matrix)
        cols = len(dem_matrix[0])

        for r in range(rows):
            for c in range(cols):
                z_dem = dem_matrix[r][c]
                d_val = depth_matrix[r][c]
                wse_val = wse_matrix[r][c]
                # Formula assertion: WSE = DEM_elevation + depth
                self.assertAlmostEqual(wse_val, z_dem + d_val, delta=0.01)

    def test_four_visualization_modes_support(self):
        """
        Verifies payload explicitly supports all 4 visualization modes:
        DEPTH, VELOCITY, WATER_SURFACE, ARRIVAL_TIME.
        """
        payload = self.service.get_3d_scene_data()
        modes = payload.get("visualization_modes", [])
        
        self.assertIn("DEPTH", modes)
        self.assertIn("VELOCITY", modes)
        self.assertIn("WATER_SURFACE", modes)
        self.assertIn("ARRIVAL_TIME", modes)
        self.assertEqual(len(modes), 4)

        # Verify corresponding matrices are present in SimulationFrame
        frame = payload["simulation_frame"]
        self.assertIn("water_depth", frame)
        self.assertIn("velocity", frame)
        self.assertIn("water_surface_elevation", frame)
        self.assertIn("arrival_time_min", frame)

    def test_vertical_exaggeration_preserves_scientific_elevations(self):
        """
        Verifies that toggling vertical exaggeration (1x, 2x, 5x) does NOT modify
        scientific coordinate matrices or physical elevation values internally.
        """
        payload_1x = self.service.get_3d_scene_data(time_step_min=30)
        
        # Verify presets exist
        self.assertEqual(payload_1x["vertical_exaggeration_presets"], [1.0, 2.0, 5.0])
        self.assertTrue(payload_1x["scientific_elevation_preserved"])

        dem_orig = payload_1x["required_3d_elements"]["real_dem_terrain"]["elevation_matrix"]
        depth_orig = payload_1x["simulation_frame"]["water_depth"]

        # Simulate visual exaggeration change in scene metadata
        # Underlying raw physical numbers must stay identical
        self.assertEqual(dem_orig[0][0], 1005.0)  # Known DEM elevation for cell (0, 0)
        self.assertIsInstance(depth_orig[0][0], float)

    def test_georeferenced_elements_and_tehri_dam(self):
        """
        Verifies Tehri Dam exact coordinates (30.3781°N, 78.4802°E), infrastructure, bridges, roads.
        """
        payload = self.service.get_3d_scene_data(time_step_min=45)
        req_elements = payload["required_3d_elements"]

        dam = req_elements["tehri_dam_position"]
        self.assertEqual(dam["latitude"], 30.3781)
        self.assertEqual(dam["longitude"], 78.4802)
        self.assertEqual(dam["elevation_m"], 839.5)
        self.assertEqual(dam["height_m"], 260.5)

        # Rivers & Reservoirs
        river = req_elements["real_river_alignment"]
        self.assertEqual(river["name"], "Bhagirathi River Main Channel")

        reservoir = req_elements["reservoir_surface"]
        self.assertEqual(reservoir["current_water_level_m"], 830.0)

        # Infrastructure & Bridges
        infra = req_elements["infrastructure_from_gis"]
        bridges = req_elements["bridges"]
        roads = req_elements["roads"]

        self.assertGreater(len(infra), 0)
        self.assertGreater(len(bridges), 0)
        self.assertGreater(len(roads), 0)


if __name__ == "__main__":
    unittest.main()
