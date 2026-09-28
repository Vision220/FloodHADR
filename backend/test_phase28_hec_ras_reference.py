import unittest
import os
import shutil
import numpy as np

from app.hec_ras.hec_ras_reference_service import (
    HECRASReferenceService,
    HECRASMetadataSchema,
    HEC_RAS_DATA_ROOT
)


class TestPhase28HECRASReference(unittest.TestCase):
    """Automated test suite for Phase 28 — Real HEC-RAS Reference Integration & Provenance."""

    def setUp(self):
        self.service = HECRASReferenceService()

    def test_01_directory_structure_existence(self):
        """Verify data/hec_ras/ subdirectories exist."""
        subdirs = ["projects", "terrain", "geometry", "flow", "results", "metadata"]
        for s in subdirs:
            path = os.path.join(HEC_RAS_DATA_ROOT, s)
            self.assertTrue(os.path.exists(path), f"Directory {path} should exist.")

    def test_02_status_not_available_when_unpopulated(self):
        """Verify un-fabricated status reporting when results are absent."""
        # Ensure temporary clean results dir for test
        temp_dir = os.path.join("data", "hec_ras_test_tmp")
        os.makedirs(os.path.join(temp_dir, "results"), exist_ok=True)
        
        test_svc = HECRASReferenceService(data_root=temp_dir)
        avail = test_svc.check_hecras_availability()

        self.assertEqual(avail["hec_ras_status"], "NOT AVAILABLE")
        self.assertEqual(avail["status_banner"], "HEC-RAS RESULT STATUS: NOT AVAILABLE")
        self.assertFalse(avail["has_imported_result"])

        # Check get_hecras_normalized_result status
        res = test_svc.get_hecras_normalized_result()
        self.assertEqual(res["hec_ras_status"], "NOT_AVAILABLE")
        self.assertIn("NOT AVAILABLE", res["status_banner"])

        # Clean up
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_03_import_package_and_common_schema(self):
        """Verify importing a package normalizes data into FloodHADR common schema."""
        raw_d = np.ones((30, 30), dtype=np.float64) * 5.0
        raw_v = np.ones((30, 30), dtype=np.float64) * 2.5

        imported = self.service.import_hecras_package(
            package_name="test_hecras_export.json",
            metadata={"hec_ras_version": "HEC-RAS 6.4.0", "project_name": "Tehri_Test_2D"},
            raw_depth_matrix=raw_d,
            raw_velocity_matrix=raw_v
        )

        self.assertEqual(imported["hec_ras_status"], "AVAILABLE")
        schema = imported["common_schema"]

        # 8 Common Schema components
        self.assertIn("time_series_sec", schema)
        self.assertIn("depth", schema)
        self.assertIn("velocity", schema)
        self.assertIn("velocity_x", schema)
        self.assertIn("velocity_y", schema)
        self.assertIn("water_surface_elevation", schema)
        self.assertIn("arrival_time", schema)
        self.assertIn("inundation_extent", schema)
        self.assertIn("mesh_metadata", schema)
        self.assertIn("coordinate_system", schema)

    def test_04_metadata_fields_completeness(self):
        """Verify all 12 metadata fields are present."""
        imported = self.service.import_hecras_package(
            package_name="test_meta_hecras.json",
            metadata={"project_name": "Tehri_Validation_Run"}
        )
        meta = imported["metadata"]

        required_meta_keys = [
            "hec_ras_version", "project_name", "geometry_version", "terrain",
            "roughness", "mesh_resolution", "timestep", "boundary_conditions",
            "simulation_duration", "scenario", "source_file", "execution_date"
        ]
        for k in required_meta_keys:
            self.assertIn(k, meta, f"Metadata key {k} must be present.")
        self.assertIn("HEC_RAS", meta["provenance"])


if __name__ == "__main__":
    unittest.main()
