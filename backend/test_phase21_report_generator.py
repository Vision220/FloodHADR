"""
backend/test_phase21_report_generator.py

Comprehensive test suite for Phase 21 — Scientific Report Generation:
1. Verifies generation of structured JSON technical reports containing all required 25+ sections and metadata fields.
2. Verifies presence of Scenario ID, Run ID, Model ID, Model version, DEM version, HEC-RAS version, Timestamp.
3. Verifies reproducibility guarantee via reproducibility_config block.
4. Verifies Markdown rendering of technical reports.
5. Verifies REST API endpoints via TestClient.
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.simulation.scientific_report_service import ScientificReportGenerator


class TestPhase21ReportGenerator(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.generator = ScientificReportGenerator()

    def test_01_report_generation_metadata_and_sections(self):
        """Verify report generation contains all required metadata and scientific sections."""
        report = self.generator.generate_full_report(
            scenario_id="scen-test-01",
            run_id="run-test-01",
            model_id="FloodHADR_SWE_2D",
            model_version="v1.0.0",
            dem_version="ALOS_PALSAR_12M_v2",
            hec_ras_version="HEC-RAS 6.4.1"
        )

        # 1. Metadata Verification
        meta = report["metadata"]
        self.assertEqual(meta["scenario_id"], "scen-test-01")
        self.assertEqual(meta["run_id"], "run-test-01")
        self.assertEqual(meta["model_id"], "FloodHADR_SWE_2D")
        self.assertEqual(meta["model_version"], "v1.0.0")
        self.assertEqual(meta["dem_version"], "ALOS_PALSAR_12M_v2")
        self.assertEqual(meta["hec_ras_version"], "HEC-RAS 6.4.1")
        self.assertIn("timestamp", meta)

        # 2. Section Verification
        self.assertIn("study_area", report)
        self.assertIn("data_sources", report)
        self.assertIn("dem", report)
        self.assertIn("dam_parameters", report)
        self.assertIn("reservoir_parameters", report)
        self.assertIn("weather", report)
        self.assertIn("hydrology", report)
        self.assertIn("breach", report)
        self.assertIn("model_2d", report)
        self.assertIn("hec_ras_model", report)
        self.assertIn("mesh", report)
        self.assertIn("boundary_conditions", report)
        self.assertIn("mannings_n", report)

        # Results Verification
        results = report["results"]
        self.assertIn("maximum_depth_m", results)
        self.assertIn("maximum_velocity_ms", results)
        self.assertIn("arrival_time_min", results)
        self.assertIn("flood_area_km2", results)

        self.assertIn("model_comparison", report)
        self.assertIn("validation", report)
        self.assertIn("sensitivity", report)
        self.assertIn("hadr", report)
        self.assertIn("limitations", report)
        self.assertIn("provenance", report)

    def test_02_reproducibility_guarantee(self):
        """Verify report includes reproducibility_config for exact run reproduction."""
        report = self.generator.generate_full_report(
            scenario_id="scen-repro-01",
            run_id="run-repro-01"
        )
        self.assertIn("reproducibility_config", report)
        repro = report["reproducibility_config"]
        self.assertEqual(repro["scenario_id"], "scen-repro-01")
        self.assertEqual(repro["run_id"], "run-repro-01")
        self.assertIn("scenario_params", repro)

    def test_03_markdown_rendering(self):
        """Verify markdown report rendering."""
        report = self.generator.generate_full_report(
            scenario_id="scen-md-01",
            run_id="run-md-01"
        )
        md = self.generator.render_markdown_report(report)
        self.assertIn("# SCIENTIFIC TECHNICAL REPORT", md)
        self.assertIn("`scen-md-01`", md)
        self.assertIn("## 1. Executive Summary & Study Area", md)
        self.assertIn("Maximum Flood Depth", md)

    def test_04_api_simulation_report_json(self):
        """Verify GET /api/reports/simulation/{sim_id} REST API endpoint."""
        response = self.client.get("/api/reports/simulation/sim-2026-001")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["metadata"]["run_id"], "sim-2026-001")
        self.assertIn("results", data)

    def test_05_api_simulation_report_markdown(self):
        """Verify GET /api/reports/simulation/{sim_id}/markdown REST API endpoint."""
        response = self.client.get("/api/reports/simulation/sim-2026-001/markdown")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/markdown", response.headers["content-type"])
        self.assertIn("# SCIENTIFIC TECHNICAL REPORT", response.text)

    def test_06_api_generate_custom_report(self):
        """Verify POST /api/reports/generate REST API endpoint."""
        payload = {
            "scenario_id": "scen-custom-99",
            "run_id": "run-custom-99",
            "format": "json"
        }
        response = self.client.post("/api/reports/generate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["metadata"]["scenario_id"], "scen-custom-99")
        self.assertEqual(data["metadata"]["run_id"], "run-custom-99")


if __name__ == "__main__":
    unittest.main()
