"""
backend/test_phase44_final_scientific_audit.py

Automated Test Suite for PHASE 44 — FINAL FLOODHADR SCIENTIFIC AUDIT.

Verifies:
1. Classification audit across all 22 core platform subsystems:
   - DAM DATA
   - RESERVOIR
   - HYDROLOGY
   - RAINFALL
   - BREACH
   - SWE
   - DWE
   - HEC-RAS
   - DEM
   - CRS
   - FLOOD EXTENT
   - DEPTH
   - VELOCITY
   - ARRIVAL TIME
   - TEMPORAL SIMULATION
   - 2D
   - 3D
   - GEE
   - INFRASTRUCTURE
   - HADR
   - AI
   - REPORTING
2. Valid classifications: PASS, PARTIAL, FAIL, NOT AVAILABLE, DEMO ONLY, REQUIRES EXTERNAL DATA.
3. Verification that ZERO subsystems FAIL.
4. REST API endpoint GET /api/gis/final-scientific-audit.
"""

import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.simulation.final_audit_service import FinalScientificAuditService


class TestPhase44FinalScientificAudit(unittest.TestCase):

    def setUp(self):
        self.service = FinalScientificAuditService()
        self.client = TestClient(app)

    def test_01_audit_22_subsystems_classification(self):
        """Verify all 22 core subsystems are audited and classified into valid categories."""
        res = self.service.run_final_audit()

        self.assertEqual(res["status"], "FINAL_SCIENTIFIC_AUDIT_COMPLETE")
        self.assertEqual(res["subsystems_audited_count"], 22)
        self.assertTrue(res["audit_passed"])

        subsystems = {item["subsystem"] for item in res["subsystem_audit"]}
        required_subsystems = {
            "DAM DATA", "RESERVOIR", "HYDROLOGY", "RAINFALL", "BREACH",
            "SWE", "DWE", "HEC-RAS", "DEM", "CRS",
            "FLOOD EXTENT", "DEPTH", "VELOCITY", "ARRIVAL TIME", "TEMPORAL SIMULATION",
            "2D", "3D", "GEE", "INFRASTRUCTURE", "HADR", "AI", "REPORTING"
        }

        self.assertEqual(subsystems, required_subsystems)

    def test_02_zero_failing_subsystems(self):
        """Verify that zero subsystems are classified as FAIL."""
        res = self.service.run_final_audit()
        counts = res["classification_summary"]

        self.assertEqual(counts.get("FAIL", 0), 0)
        self.assertGreater(counts.get("PASS", 0), 15)

    def test_03_rest_api_final_audit_endpoint(self):
        """Test GET /api/gis/final-scientific-audit REST endpoint."""
        r = self.client.get("/api/gis/final-scientific-audit")
        self.assertEqual(r.status_code, 200)
        data = r.json()

        self.assertEqual(data["status"], "FINAL_SCIENTIFIC_AUDIT_COMPLETE")
        self.assertTrue(data["audit_passed"])
        self.assertEqual(data["subsystems_audited_count"], 22)


if __name__ == "__main__":
    unittest.main()
