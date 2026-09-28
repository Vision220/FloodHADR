"""
backend/test_phase26_spatial_alignment.py

Phase 26 — Spatial Alignment Automated Test Suite.

Verifies:
1. Simultaneous presence of all 11 diagnostic alignment layers.
2. Spatial verification checklist (CRS match, Lat/Lng bounds, no coordinate reversal/swap).
3. 4 diagnostic map overlay modes (RIVER, FLOODHADR, HEC-RAS, DIFFERENCE).
4. Discrepancy root cause attribution engine payload.
"""

import unittest
from app.gis.gis_2d_service import GIS2DLayerService


class TestPhase26SpatialAlignment(unittest.TestCase):

    def setUp(self):
        self.gis_service = GIS2DLayerService()
        self.alignment_data = self.gis_service.get_spatial_alignment_diagnostic_data(time_step_min=60)

    def test_01_simultaneous_11_layers_presence(self):
        """Verify all 11 diagnostic layers are present in the payload."""
        self.assertEqual(self.alignment_data["status"], "ALIGNMENT_VERIFIED")
        layers = self.alignment_data["diagnostic_layers"]
        
        expected_layers = [
            "1_dem", "2_river_centerline", "3_river_bank", "4_dam", "5_breach",
            "6_flood_depth", "7_flood_extent", "8_velocity_vectors",
            "9_flow_direction", "10_hecras_result", "11_terrain_contours"
        ]
        for key in expected_layers:
            self.assertIn(key, layers, f"Missing layer '{key}' in diagnostic_layers.")

    def test_02_spatial_verification_checklist(self):
        """Validate all 10 spatial alignment verification checks."""
        checks = self.alignment_data["verification_checks"]
        
        expected_checks = [
            "crs_matched", "river_located_correctly", "dam_located_correctly",
            "breach_located_correctly", "downstream_valley_represented",
            "flood_domain_entry_correct", "no_coordinate_reversal",
            "no_lat_lng_swap", "no_raster_transform_error", "no_map_projection_error"
        ]
        for check in expected_checks:
            self.assertIn(check, checks)
            self.assertTrue(checks[check], f"Spatial check '{check}' failed.")

    def test_03_diagnostic_overlay_modes(self):
        """Test RIVER, FLOODHADR, HEC-RAS, and DIFFERENCE overlay payloads."""
        overlays = self.alignment_data["overlay_modes"]
        self.assertIn("RIVER", overlays)
        self.assertIn("FLOODHADR", overlays)
        self.assertIn("HEC-RAS", overlays)
        self.assertIn("DIFFERENCE", overlays)

        # Check coordinates in RIVER layer (Lng in [78, 79], Lat in [29, 31])
        river_coords = overlays["RIVER"]["features"][0]["geometry"]["coordinates"]
        for lng, lat in river_coords:
            self.assertGreaterEqual(lat, 29.0)
            self.assertLessEqual(lat, 31.0)
            self.assertGreaterEqual(lng, 78.0)
            self.assertLessEqual(lng, 79.0)

    def test_04_discrepancy_attribution_engine(self):
        """Verify root cause discrepancy attribution payload."""
        attribution = self.alignment_data["discrepancy_attribution"]
        self.assertIn("primary_cause", attribution)
        self.assertIn("explanation", attribution)


if __name__ == "__main__":
    unittest.main()
