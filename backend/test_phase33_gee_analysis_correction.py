"""
backend/test_phase33_gee_analysis_correction.py

Automated Test Suite for Phase 33: Google Earth Engine Flood Analysis Correction.
Verifies explicit role separation (GEE does NOT calculate dam-break hydraulics),
execution state standards (LIVE, DEMO, NOT CONFIGURED, ERROR), mandatory 7-field metadata,
3-way spatial comparison (GEE vs FloodHADR vs HEC-RAS), and non-fabrication rules.
"""

import unittest
from app.services.gee.gee_auth import GEEAuth
from app.services.gee.gee_flood import GEEFloodService
from app.services.gee.gee_imagery import GEEImageryService
from app.services.gee.gee_rainfall import GEERainfallService
from app.services.gee.gee_client import GEEClient


class TestPhase33GEEAnalysisCorrection(unittest.TestCase):

    def setUp(self):
        self.client = GEEClient()
        self.flood_service = GEEFloodService(self.client)
        self.imagery_service = GEEImageryService(self.client)
        self.rainfall_service = GEERainfallService(self.client)

    def test_01_role_separation_and_execution_state(self):
        """Test explicit role separation and GEE execution state standard."""
        status = GEEAuth.get_status()
        self.assertIn("execution_state", status)
        self.assertIn(status["execution_state"], ["LIVE", "DEMO", "NOT CONFIGURED", "ERROR"])
        self.assertNotIn("online", str(status.get("execution_state", "")).lower())

        self.assertIn("separated_roles", status)
        roles = status["separated_roles"]
        self.assertIn("EXPLICITLY_DISABLED_IN_GEE", roles["A_hydrodynamic_simulation"])
        self.assertIn("Sentinel-1", roles["B_satellite_observation"])
        self.assertIn("CHIRPS", roles["C_rainfall_remote_sensing"])
        self.assertIn("ESA WorldCover", roles["D_land_cover"])
        self.assertIn("3-Way Spatial Comparison", roles["E_flood_extent_validation"])

    def test_02_mandatory_7_field_layer_metadata(self):
        """Test that every GEE layer returns all 7 mandatory metadata fields."""
        required_fields = [
            "dataset",
            "acquisition_date",
            "processing_method",
            "cloud_filtering",
            "spatial_resolution",
            "source",
            "provenance"
        ]

        # 1. Sentinel-1 SAR Layer
        sar_res = self.flood_service.get_sentinel1_sar(geometry_input=None)
        for field in required_fields:
            self.assertIn(field, sar_res, f"Missing {field} in Sentinel-1 SAR metadata")

        # 2. Sentinel-2 Optical Layer
        opt_res = self.imagery_service.get_sentinel2_imagery(geometry_input=None)
        for field in required_fields:
            self.assertIn(field, opt_res, f"Missing {field} in Sentinel-2 metadata")

        # 3. CHIRPS Rainfall Layer
        rain_res = self.rainfall_service.get_chirps_rainfall(geometry_input=None)
        for field in required_fields:
            self.assertIn(field, rain_res, f"Missing {field} in CHIRPS rainfall metadata")

        # 4. Satellite Flood Extent Layer
        ext_res = self.flood_service.get_satellite_flood_extent(geometry_input=None)
        for field in required_fields:
            self.assertIn(field, ext_res, f"Missing {field} in Flood Extent metadata")

    def test_03_three_way_spatial_flood_extent_comparison(self):
        """Test 3-way spatial comparison between GEE, FloodHADR, and HEC-RAS."""
        comp = self.flood_service.compare_flood_extent(
            simulated_area_km2=28.5,
            observed_area_km2=24.8,
            hecras_area_km2=27.2
        )

        self.assertIn("execution_state", comp)
        self.assertIn("extents_km2", comp)
        self.assertIn("spatial_metrics", comp)

        extents = comp["extents_km2"]
        self.assertEqual(extents["gee_observed_extent_km2"], 24.8)
        self.assertEqual(extents["floodhadr_simulated_extent_km2"], 28.5)
        self.assertEqual(extents["hecras_simulated_extent_km2"], 27.2)

        metrics = comp["spatial_metrics"]
        self.assertIn("floodhadr_vs_gee_iou", metrics)
        self.assertIn("hecras_vs_gee_iou", metrics)
        self.assertIn("floodhadr_vs_hecras_iou", metrics)
        self.assertGreater(metrics["floodhadr_vs_gee_iou"], 0.50)
        self.assertGreater(metrics["hecras_vs_gee_iou"], 0.50)
        self.assertGreater(metrics["floodhadr_vs_hecras_iou"], 0.70)

    def test_04_no_fabrication_rule(self):
        """Test that unauthenticated fallback mode clearly marks provenance as DEMO / DEMO_METRIC."""
        ext_res = self.flood_service.get_satellite_flood_extent(geometry_input=None)
        if not self.client.is_auth:
            self.assertEqual(ext_res["provenance"], "DEMO")
            self.assertEqual(ext_res["execution_state"], "DEMO")

        comp = self.flood_service.compare_flood_extent(simulated_area_km2=28.5, observed_area_km2=24.8)
        self.assertFalse(comp.get("is_fabricated", True))


if __name__ == "__main__":
    unittest.main()
