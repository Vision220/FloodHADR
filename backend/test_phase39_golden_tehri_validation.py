"""
backend/test_phase39_golden_tehri_validation.py

Automated Test Suite for Phase 39 — Golden Tehri End-to-End Validation.

Verifies:
1. Full 16-Stage Controlled Pipeline Execution:
   - Scenario definition -> Tehri reservoir -> Dam-break -> FloodHADR SWE/DWE -> HEC-RAS SWE/DWE -> Model Comparison -> 2D Flood Map -> Temporal Animation -> 3D Digital Twin -> GEE Satellite Comparison -> Infrastructure Impact -> HADR -> AI Analysis -> Technical Report.
2. Stage Consistency Audit:
   - 100% Parameter Identity across all 16 stages (scenario_id, run_id, CRS, DEM, time_reference, simulation_duration).
3. Parametric Sensitivity & Data Connection Audit:
   - Changing breach width (60m -> 180m) alters hydrograph, flood extent, depth, velocity, 2D GIS, 3D twin, HADR impact, AI explanation, and technical report.
   - Detects and flags any broken data connections (broken_data_connection_detected == False).
4. REST API Endpoints:
   - GET  /api/benchmark/golden/baseline-parameters
   - POST /api/benchmark/golden/run
   - POST /api/benchmark/golden/audit-sensitivity
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.simulation.golden_benchmark_service import GoldenBenchmarkService


class TestPhase39GoldenTehriValidation(unittest.TestCase):

    def setUp(self):
        self.service = GoldenBenchmarkService()
        self.client = TestClient(app)

    def test_01_full_16_stage_controlled_pipeline(self):
        """Verify execute_golden_pipeline runs all 16 stages end-to-end with status SUCCESS."""
        res = self.service.execute_golden_pipeline()

        self.assertEqual(res["benchmark_status"], "SUCCESS")
        self.assertEqual(res["scenario_id"], "TEHRI_GOLDEN_BENCHMARK_V1")
        self.assertIsNotNone(res["run_id"])

        stages = res["pipeline_stages"]
        required_16_stages = [
            "1_scenario_definition",
            "2_tehri_reservoir",
            "3_dam_break",
            "4_floodhadr_swe",
            "5_floodhadr_dwe",
            "6_hecras_swe",
            "7_hecras_dwe",
            "8_model_comparison",
            "9_2d_flood_map",
            "10_temporal_animation",
            "11_3d_digital_twin",
            "12_gee_satellite_comparison",
            "13_infrastructure_impact",
            "14_hadr_decision_support",
            "15_ai_analysis",
            "16_scientific_report"
        ]

        for st_key in required_16_stages:
            self.assertIn(st_key, stages, f"Missing required pipeline stage: {st_key}")

    def test_02_stage_consistency_audit(self):
        """Verify all 16 stages share 100% identical scenario_id, run_id, CRS, DEM, and time metadata."""
        res = self.service.execute_golden_pipeline()
        audit = res["stage_consistency_audit"]

        self.assertEqual(audit["total_stages_audited"], 16)
        self.assertTrue(audit["stage_consistency_verified"], "Stage consistency audit failed across 16 stages!")
        
        for item in audit["stage_breakdown"]:
            self.assertTrue(item["consistency_passed"], f"Consistency failed for stage {item['stage']}")

    def test_03_parametric_sensitivity_and_broken_connection_audit(self):
        """Verify changing breach width (60m -> 180m) alters all downstream layers and flags zero broken connections."""
        res = self.service.audit_parametric_sensitivity(modified_params={"breach_width_m": 180.0})

        self.assertEqual(res["status"], "PARAMETRIC_SENSITIVITY_AUDIT_COMPLETE")
        self.assertFalse(res["broken_connection_detected"], f"Broken data connection detected in layers: {res['broken_layers']}")
        self.assertEqual(len(res["broken_layers"]), 0)

        flags = res["layer_responsiveness_audit"]
        self.assertTrue(flags["hydrograph_changed"])
        self.assertTrue(flags["flood_extent_changed"])
        self.assertTrue(flags["depth_changed"])
        self.assertTrue(flags["velocity_changed"])
        self.assertTrue(flags["gis_2d_changed"])
        self.assertTrue(flags["twin_3d_changed"])
        self.assertTrue(flags["hadr_changed"])
        self.assertTrue(flags["ai_explanation_changed"])
        self.assertTrue(flags["report_changed"])

    def test_04_rest_api_golden_benchmark_endpoints(self):
        """Test GET /baseline-parameters, POST /run, and POST /audit-sensitivity REST endpoints."""
        # 1. Baseline parameters
        r1 = self.client.get("/api/benchmark/golden/baseline-parameters")
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r1.json()["scenario_id"], "TEHRI_GOLDEN_BENCHMARK_V1")

        # 2. Run pipeline
        r2 = self.client.post("/api/benchmark/golden/run", json={"scenario_params": {"breach_width_m": 180.0}, "time_step_min": 60})
        self.assertEqual(r2.status_code, 200)
        data2 = r2.json()
        self.assertEqual(data2["benchmark_status"], "SUCCESS")
        self.assertTrue(data2["stage_consistency_audit"]["stage_consistency_verified"])

        # 3. Audit sensitivity
        r3 = self.client.post("/api/benchmark/golden/audit-sensitivity", json={"modified_params": {"breach_width_m": 180.0}, "time_step_min": 60})
        self.assertEqual(r3.status_code, 200)
        data3 = r3.json()
        self.assertFalse(data3["broken_connection_detected"])


if __name__ == "__main__":
    unittest.main()
