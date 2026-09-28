"""
Phase 10 - HEC-RAS 2D Hydraulic Model Test Suite
Validates mesh presets, breaklines, refinement regions, SWE/DWE solvers,
component configurations, metadata recording, and API endpoints.
"""

import os
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.hec_ras.hec_ras_mesh import HECRAS2DMeshGenerator, HECRASMeshConfig, MeshResolutionPreset
from app.hec_ras.hec_ras_2d_model import HECRAS2DModelBuilder, HECRAS2DModelConfig


class TestPhase10HECRAS2DModel(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_mesh_resolution_presets(self):
        """Test COARSE, MEDIUM, FINE mesh preset properties and trade-off notices."""
        coarse_mesh = HECRAS2DMeshGenerator(HECRASMeshConfig(preset=MeshResolutionPreset.COARSE)).generate_mesh()
        medium_mesh = HECRAS2DMeshGenerator(HECRASMeshConfig(preset=MeshResolutionPreset.MEDIUM)).generate_mesh()
        fine_mesh = HECRAS2DMeshGenerator(HECRASMeshConfig(preset=MeshResolutionPreset.FINE)).generate_mesh()

        self.assertEqual(coarse_mesh["resolution_preset"], "COARSE")
        self.assertEqual(coarse_mesh["dx_m"], 50.0)
        self.assertEqual(coarse_mesh["dy_m"], 50.0)
        self.assertEqual(coarse_mesh["recommended_timestep_s"], 5.0)

        self.assertEqual(medium_mesh["resolution_preset"], "MEDIUM")
        self.assertEqual(medium_mesh["dx_m"], 25.0)
        self.assertEqual(medium_mesh["dy_m"], 25.0)
        self.assertEqual(medium_mesh["recommended_timestep_s"], 2.0)

        self.assertEqual(fine_mesh["resolution_preset"], "FINE")
        self.assertEqual(fine_mesh["dx_m"], 10.0)
        self.assertEqual(fine_mesh["dy_m"], 10.0)
        self.assertEqual(fine_mesh["recommended_timestep_s"], 0.5)

        # Confirm scientific fine mesh accuracy trade-off notice
        self.assertIn("does NOT automatically guarantee higher hydraulic accuracy", fine_mesh["trade_off_notice"])

    def test_breaklines_and_refinement_regions(self):
        """Test structural breaklines and hydrodynamic refinement regions are populated."""
        mesh = HECRAS2DMeshGenerator(HECRASMeshConfig(preset=MeshResolutionPreset.MEDIUM)).generate_mesh()
        
        self.assertGreaterEqual(len(mesh["breaklines"]), 3)
        breakline_names = [b["name"] if isinstance(b, dict) else b for b in mesh["breaklines"]]
        self.assertIn("Bhagirathi_Main_Channel_Thalweg", breakline_names)
        self.assertIn("Right_Canyon_Wall_Ridge", breakline_names)

        self.assertGreaterEqual(len(mesh["refinement_regions"]), 2)
        refinement_names = [r["name"] if isinstance(r, dict) else r for r in mesh["refinement_regions"]]
        self.assertIn("Dam_Toe_High_Gradient_Zone", refinement_names)
        self.assertIn("Koti_Nala_Confluence_Zone", refinement_names)

    def test_builder_all_11_components(self):
        """Test HECRAS2DModelBuilder populates all 11 required components."""
        config = HECRAS2DModelConfig(
            mesh_preset=MeshResolutionPreset.FINE,
            solver="HEC-RAS SWE",
            manning_n_channel=0.035,
            reservoir_elevation_m=830.0,
            breach_width_m=120.0,
            formation_time_hr=1.5
        )
        builder = HECRAS2DModelBuilder(config)
        model_payload = builder.build_2d_model()

        components = model_payload["components"]
        required_keys = [
            "terrain",
            "flow_area_2d",
            "computational_mesh",
            "breaklines",
            "refinement_regions",
            "manning_n",
            "upstream_boundary",
            "downstream_boundary",
            "reservoir_condition",
            "dam_connection",
            "breach_configuration"
        ]
        for key in required_keys:
            self.assertIn(key, components, f"Missing component: {key}")

    def test_solver_selection_swe_and_dwe(self):
        """Test equation selection between HEC-RAS SWE and HEC-RAS DWE."""
        swe_config = HECRAS2DModelConfig(solver="HEC-RAS SWE")
        swe_model = HECRAS2DModelBuilder(swe_config).build_2d_model()
        self.assertEqual(swe_model["metadata"]["solver"], "HEC-RAS SWE")

        dwe_config = HECRAS2DModelConfig(solver="HEC-RAS DWE")
        dwe_model = HECRAS2DModelBuilder(dwe_config).build_2d_model()
        self.assertEqual(dwe_model["metadata"]["solver"], "HEC-RAS DWE")

    def test_metadata_recording_schema(self):
        """Test metadata payload records all required configuration attributes."""
        config = HECRAS2DModelConfig(
            mesh_preset=MeshResolutionPreset.MEDIUM,
            solver="HEC-RAS SWE"
        )
        builder = HECRAS2DModelBuilder(config)
        model_payload = builder.build_2d_model()
        meta = model_payload["metadata"]

        self.assertIn("mesh_size_m", meta)
        self.assertEqual(meta["mesh_size_m"], 25.0)
        self.assertIn("cell_count", meta)
        self.assertIn("breaklines", meta)
        self.assertIsInstance(meta["breaklines"], list)
        self.assertIn("refinement_regions", meta)
        self.assertIsInstance(meta["refinement_regions"], list)
        self.assertIn("timestep_s", meta)
        self.assertEqual(meta["timestep_s"], 2.0)
        self.assertIn("solver", meta)
        self.assertEqual(meta["solver"], "HEC-RAS SWE")
        self.assertIn("boundary_conditions", meta)
        self.assertIn("upstream", meta["boundary_conditions"])
        self.assertIn("downstream", meta["boundary_conditions"])

    def test_api_2d_presets_endpoint(self):
        """Test REST API GET /api/hecras/2d/presets."""
        response = self.client.get("/api/hecras/2d/presets")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("supported_mesh_presets", data)

    def test_api_2d_generate_model_endpoint(self):
        """Test REST API POST /api/hecras/2d/generate-model."""
        payload = {
            "mesh_preset": "MEDIUM",
            "equation_mode": "SWE",
            "manning_n": 0.035,
            "reservoir_level_m": 830.0,
            "breach_width_m": 120.0
        }
        response = self.client.post("/api/hecras/2d/generate-model", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["model_type"], "HEC-RAS 2D Hydraulic Model")
        self.assertEqual(data["metadata"]["mesh_preset"], "MEDIUM")
        self.assertEqual(data["metadata"]["solver"], "HEC-RAS SWE")

    def test_api_2d_simulate_endpoint(self):
        """Test REST API POST /api/hecras/2d/simulate with execution status check."""
        payload = {
            "mesh_preset": "FINE",
            "equation_mode": "DWE",
            "reservoir_level_m": 830.0
        }
        response = self.client.post("/api/hecras/2d/simulate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("execution_status", data)
        self.assertEqual(data["metadata"]["solver"], "HEC-RAS DWE")


if __name__ == "__main__":
    unittest.main()
