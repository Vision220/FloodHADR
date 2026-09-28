"""
backend/test_phase18_ai_assistant.py

Automated Test Suite for Phase 18 — AI Hydraulic Model Comparison Assistant.
Verifies:
1. Access to 8 mandatory data context inputs (scenario params, FloodHADR results, HEC-RAS results,
   observations, validation metrics, data provenance, model assumptions, simulation logs).
2. Scientific explanation generation answering 7 key questions (why differ, where differ, parameter diffs,
   mesh impact, observational support, calibration status, uncertainty analysis).
3. Zero Fabrication & Non-Declaration Guardrails:
   - Prohibition against declaring "Model X is the best", "superior", or "correct".
   - Enforcement of objective comparative phrasing ("The two models differ by X", "The largest difference occurs in region Y", "The available observational data are insufficient to establish...").
4. REST API endpoints GET /api/analysis/ai-assistant/context & POST /api/analysis/ai-assistant/explain.
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.simulation.ai_comparison_assistant import AIHydraulicAssistantService


class TestPhase18AIAssistant(unittest.TestCase):

    def setUp(self):
        self.assistant = AIHydraulicAssistantService()
        self.client = TestClient(app)

    def test_01_access_to_8_data_inputs(self):
        """Verify assistant has direct access to all 8 mandatory data context inputs."""
        context = self.assistant.get_full_context()

        required_8_inputs = [
            "scenario_parameters",
            "flodhadr_results",
            "hecras_results",
            "observations",
            "validation_metrics",
            "data_provenance",
            "model_assumptions",
            "simulation_logs"
        ]

        for req_in in required_8_inputs:
            self.assertIn(req_in, context, f"Missing required context input: {req_in}")

    def test_02_all_7_scientific_explanations(self):
        """Verify assistant generates explanations for all 7 scientific comparison topics."""
        topics = [
            "why_differ",
            "where_differ",
            "parameter_diff",
            "mesh_impact",
            "observational_support",
            "calibration_status",
            "uncertainty_analysis"
        ]

        for t in topics:
            res = self.assistant.process_query(t)
            self.assertIn("explanation", res)
            self.assertGreater(len(res["explanation"]), 20)

    def test_03_non_declaration_guardrail_no_best_model_claim(self):
        """Verify assistant NEVER declares 'Model X is the best', 'superior', or 'correct'."""
        topics = ["why_differ", "where_differ", "parameter_diff", "mesh_impact", "observational_support", "calibration_status", "uncertainty_analysis"]

        forbidden_phrases = [
            "is the best model",
            "is superior to",
            "is the most accurate model",
            "is better than",
            "is the correct model"
        ]

        for t in topics:
            res = self.assistant.process_query(t)
            explanation = res["explanation"].lower()
            for forbidden in forbidden_phrases:
                self.assertNotIn(forbidden, explanation, f"Forbidden non-declaration phrase '{forbidden}' found in response to query '{t}'")

    def test_04_objective_comparative_phrasing(self):
        """Verify responses use objective comparative statements."""
        why_res = self.assistant.explain_why_models_differ()
        self.assertIn("the two models differ by", why_res["explanation"].lower())

        where_res = self.assistant.explain_where_models_differ()
        self.assertIn("the largest difference occurs in region", where_res["explanation"].lower())

        obs_res = self.assistant.explain_observational_support()
        self.assertIn("the available observational data are insufficient to establish", obs_res["explanation"].lower())

    def test_05_zero_fabrication_uncalibrated_declaration(self):
        """Verify assistant accurately reports uncalibrated scenario status without fabricating calibration data."""
        calib_res = self.assistant.explain_calibration_status()
        self.assertFalse(calib_res["field_calibration_available"])
        self.assertIn("NOT available", calib_res["explanation"])

    def test_06_rest_api_ai_assistant_endpoints(self):
        """Test GET /api/analysis/ai-assistant/context & POST /api/analysis/ai-assistant/explain REST endpoints."""
        # GET Context
        ctx_res = self.client.get("/api/analysis/ai-assistant/context")
        self.assertEqual(ctx_res.status_code, 200)
        self.assertIn("scenario_parameters", ctx_res.json())

        # POST Explain
        exp_res = self.client.post("/api/analysis/ai-assistant/explain", json={"query_topic": "why_differ"})
        self.assertEqual(exp_res.status_code, 200)
        data_exp = exp_res.json()
        self.assertIn("explanation", data_exp)
        self.assertIn("the two models differ by", data_exp["explanation"].lower())


if __name__ == "__main__":
    unittest.main()
