"""
Phase 11 - HEC-RAS Result Importer Test Suite
Validates HEC-RAS result importing, output field extraction (depth, velocity, WSE, arrival time, extent, hydrographs),
SimulationFrame normalization, spatial CRS/resolution normalization, provenance metadata stamping,
and scientific integrity mandates.
"""

import os
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.hec_ras.hec_ras_importer import HECRASResultImporter
from app.schemas.domain_schemas import SimulationRun, SimulationFrame


class TestPhase11HECRASResultImporter(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.importer = HECRASResultImporter(target_crs="EPSG:32644", target_resolution_m=25.0)

    def test_01_import_hecras_results_structure(self):
        """Verify HEC-RAS importer returns valid SimulationRun with SimulationFrame sequence."""
        run = self.importer.import_hecras_results(
            scenario_id="scen-tehri-overtop",
            parameters={"breach_width_m": 180.0, "formation_time_hr": 1.5, "reservoir_level_m": 830.0}
        )

        self.assertIsInstance(run, SimulationRun)
        self.assertEqual(run.model_id, "HEC_RAS")
        self.assertEqual(run.scenario_id, "scen-tehri-overtop")
        self.assertGreater(len(run.frames), 0)
        self.assertIsInstance(run.frames[0], SimulationFrame)

    def test_02_all_7_imported_output_fields(self):
        """Verify all 7 required output sets: Max Depth, Max Vel, WSE, Arrival Time, Extent, Hydrographs, Frames."""
        run = self.importer.import_hecras_results()
        rasters = run.summary_rasters

        # 1. Maximum Depth
        self.assertIn("max_depth_matrix", rasters)
        self.assertGreater(run.max_depth_m, 0.0)

        # 2. Maximum Velocity
        self.assertIn("max_velocity_matrix", rasters)
        self.assertGreater(run.max_velocity_ms, 0.0)

        # 3. Water Surface Elevation
        self.assertIn("water_surface_elevation_matrix", rasters)

        # 4. Arrival Time
        self.assertIn("arrival_time_matrix", rasters)

        # 5. Inundation Extent (GeoJSON & Flooded Area)
        self.assertIn("inundation_extent_geojson", rasters)
        self.assertGreater(run.max_flood_area_km2, 0.0)

        # 6. Hydrographs
        self.assertGreaterEqual(len(run.hydrograph), 3)
        gauge_ids = [g["gauge_id"] for g in run.hydrograph]
        self.assertIn("gauge-dam-toe", gauge_ids)
        self.assertIn("gauge-koti-nala", gauge_ids)
        self.assertIn("gauge-devprayag", gauge_ids)

        # 7. Time-series SimulationFrames
        self.assertEqual(len(run.frames), 7)
        self.assertEqual(run.frames[0].frame_index, 0)
        self.assertEqual(run.frames[-1].frame_index, 6)

    def test_03_metadata_provenance_stamping(self):
        """Verify metadata fields: model, model_version, scenario_id, run_id, timestamp, terrain_version, parameters, provenance."""
        run = self.importer.import_hecras_results(
            scenario_id="scen-test-phase11",
            run_id="run-phase11-001"
        )
        params = run.parameters

        self.assertEqual(run.model_id, "HEC_RAS")
        self.assertEqual(params.get("model"), "HEC_RAS")
        self.assertEqual(run.model_version, "6.4.0")
        self.assertEqual(params.get("model_version"), "6.4.0")
        self.assertEqual(run.scenario_id, "scen-test-phase11")
        self.assertEqual(run.run_id, "run-phase11-001")
        self.assertIn("timestamp", params)
        self.assertEqual(params.get("terrain_version"), "ALOS_PALSAR_12M_REAL")
        self.assertIn("parameters", run.dict())
        self.assertEqual(run.provenance, "HEC_RAS_RESULT_IMPORTER")

    def test_04_spatial_crs_and_resolution_normalization(self):
        """Verify spatial CRS and raster resolution normalization parameters."""
        run = self.importer.import_hecras_results()
        spatial_norm = run.summary_rasters["spatial_normalization"]

        self.assertEqual(spatial_norm["normalized_crs"], "EPSG:32644")
        self.assertEqual(spatial_norm["target_resolution_m"], 25.0)
        self.assertEqual(spatial_norm["target_grid_shape"], [30, 30])
        self.assertEqual(spatial_norm["crs_status"], "NORMALIZED_MATCH")

        # Check grid shapes match 30x30
        max_d_matrix = run.summary_rasters["max_depth_matrix"]
        self.assertEqual(len(max_d_matrix), 30)
        self.assertEqual(len(max_d_matrix[0]), 30)

    def test_05_scientific_integrity_no_modification(self):
        """Verify HEC-RAS results are imported directly without post-hoc modification."""
        run = self.importer.import_hecras_results()
        notice = run.parameters.get("scientific_integrity", "")
        self.assertIn("imported directly without post-hoc modification", notice)

    def test_06_rest_api_import_endpoint(self):
        """Test REST API POST /api/hecras/import."""
        payload = {
            "scenario_id": "scen-tehri-overtop",
            "plan_id": "p01",
            "target_crs": "EPSG:32644",
            "target_resolution_m": 25.0,
            "breach_width_m": 180.0,
            "formation_time_hr": 1.5,
            "reservoir_level_m": 830.0
        }
        response = self.client.post("/api/hecras/import", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["model_id"], "HEC_RAS")
        self.assertEqual(data["model_version"], "6.4.0")
        self.assertEqual(data["scenario_id"], "scen-tehri-overtop")
        self.assertEqual(data["provenance"], "HEC_RAS_RESULT_IMPORTER")
        self.assertIn("summary_rasters", data)
        self.assertIn("frames", data)
        self.assertEqual(len(data["frames"]), 7)


if __name__ == "__main__":
    unittest.main()
