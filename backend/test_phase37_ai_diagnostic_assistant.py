"""
backend/test_phase37_ai_diagnostic_assistant.py

Automated Test Suite for Phase 37 — Scientific AI Model Comparison and Diagnostic Assistant.

Verifies:
1. All 8 explicit data inspection functions (get_scenario, get_model_result, get_model_metrics,
   get_virtual_gauge, get_validation_result, get_flood_extent_statistics, get_asset_impacts, get_provenance).
2. Diagnostic question answering across 8 required key scientific questions.
3. Zero Fabrication Mandate: Never invents results; returns "Insufficient evidence in the current project dataset." when unverified.
4. Mandatory Scientific Citations: Every answer includes Scenario ID, Model, Run ID, Dataset, Timestamp.
5. AI Audit Log integrity: Records question, retrieved_datasets, calculations, answer, timestamp, model_version.
6. REST API Endpoints:
   - POST /api/analysis/ai-assistant/query
   - GET  /api/analysis/ai-assistant/audit-log
   - GET  /api/analysis/ai-assistant/tools/*
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.simulation.ai_comparison_assistant import ScientificAIAssistantService


class TestPhase37AIDiagnosticAssistant(unittest.TestCase):

    def setUp(self):
        self.assistant = ScientificAIAssistantService()
        self.client = TestClient(app)

    def test_01_explicit_8_inspection_tools(self):
        """Verify all 8 explicit data inspection tools/functions return real stored values."""
        # 1. get_scenario()
        scen = self.assistant.get_scenario("TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO")
        self.assertIn("scenario_id", scen)

        # 2. get_model_result()
        swe_res = self.assistant.get_model_result("FloodHADR SWE")
        self.assertIn("flooded_area_km2", swe_res)

        # 3. get_model_metrics()
        metrics = self.assistant.get_model_metrics("FloodHADR SWE")
        self.assertIn("extent_iou", metrics)

        # 4. get_virtual_gauge()
        gauge = self.assistant.get_virtual_gauge("gauge-01-dam-toe")
        self.assertIsNotNone(gauge)

        # 5. get_validation_result()
        val = self.assistant.get_validation_result("FloodHADR SWE", "HEC-RAS SWE")
        self.assertIn("hydraulic_metrics", val)

        # 6. get_flood_extent_statistics()
        extent = self.assistant.get_flood_extent_statistics("SENTINEL1_SAR")
        self.assertIn("flooded_area_km2", extent)

        # 7. get_asset_impacts()
        impacts = self.assistant.get_asset_impacts("TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO")
        self.assertIn("outputs", impacts)
        self.assertIn("total_exposed_assets", impacts)

        # 8. get_provenance()
        prov = self.assistant.get_provenance("DEM")
        self.assertEqual(prov["crs"], "EPSG:32644 (UTM Zone 44N)")

    def test_02_key_8_diagnostic_questions(self):
        """Verify assistant accurately answers the 8 required scientific diagnostic questions with citations."""
        questions = [
            "What changed between SWE and DWE?",
            "Why is the FloodHADR flood extent different from HEC-RAS?",
            "Which locations have the earliest arrival?",
            "What parameters caused the largest difference?",
            "Is HEC-RAS data actually available?",
            "Does the satellite-derived flood extent support the hydraulic result?",
            "What data are missing for stronger validation?",
            "What changed when the breach width was increased?"
        ]

        for q in questions:
            res = self.assistant.answer_question(q)
            self.assertEqual(res["status"], "SUCCESS")
            answer = res["answer"]
            self.assertGreater(len(answer), 50)
            
            # Check mandatory citation
            self.assertIn("Scenario ID:", answer)
            self.assertIn("Model:", answer)
            self.assertIn("Run ID:", answer)
            self.assertIn("Dataset:", answer)
            self.assertIn("Timestamp:", answer)

    def test_03_zero_fabrication_insufficient_evidence(self):
        """Verify assistant returns 'Insufficient evidence in the current project dataset.' for unverified queries."""
        unverified_q = "What is the surface temperature of the moon in scenario TEHRI_PMF?"
        res = self.assistant.answer_question(unverified_q)
        self.assertIn("Insufficient evidence in the current project dataset.", res["answer"])

    def test_04_ai_audit_log_tracking(self):
        """Verify AI Audit Log records question, retrieved datasets, calculations, answer, timestamp, model version."""
        self.assistant.answer_question("What changed between SWE and DWE?")
        audit = self.assistant.get_audit_log()
        self.assertGreater(len(audit), 0)
        
        last_entry = audit[-1]
        self.assertIn("question", last_entry)
        self.assertIn("retrieved_datasets", last_entry)
        self.assertIn("calculations", last_entry)
        self.assertIn("answer", last_entry)
        self.assertIn("timestamp", last_entry)
        self.assertIn("model_version", last_entry)

    def test_05_rest_api_diagnostic_query_and_audit(self):
        """Test POST /api/analysis/ai-assistant/query and GET /api/analysis/ai-assistant/audit-log REST endpoints."""
        # Query endpoint
        resp = self.client.post("/api/analysis/ai-assistant/query", json={"question": "What changed between SWE and DWE?"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertIn("Scenario ID:", data["answer"])

        # Audit Log endpoint
        audit_resp = self.client.get("/api/analysis/ai-assistant/audit-log")
        self.assertEqual(audit_resp.status_code, 200)
        audit_data = audit_resp.json()
        self.assertIn("audit_log", audit_data)
        self.assertGreater(audit_data["audit_log_count"], 0)

    def test_06_rest_api_tool_inspection_routes(self):
        """Test GET /api/analysis/ai-assistant/tools/* inspection routes."""
        endpoints = [
            "/api/analysis/ai-assistant/tools/scenario",
            "/api/analysis/ai-assistant/tools/model-result",
            "/api/analysis/ai-assistant/tools/virtual-gauge",
            "/api/analysis/ai-assistant/tools/validation-result",
            "/api/analysis/ai-assistant/tools/flood-extent-statistics",
            "/api/analysis/ai-assistant/tools/asset-impacts",
            "/api/analysis/ai-assistant/tools/provenance"
        ]

        for ep in endpoints:
            r = self.client.get(ep)
            self.assertEqual(r.status_code, 200, f"Failed GET on tool endpoint {ep}")


if __name__ == "__main__":
    unittest.main()
