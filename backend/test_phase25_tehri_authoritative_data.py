import unittest
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.dam_safety.tehri_authoritative_data import (
    get_authoritative_tehri_parameters,
    DamParameterSchema,
    TEHRI_AUTHORITATIVE_PARAMETERS
)

class TestPhase25TehriAuthoritativeData(unittest.TestCase):
    """Test suite for Phase 25 Tehri Dam Authoritative Data Model & Provenance."""

    def test_01_authoritative_parameters_presence(self):
        """Verify THDC official baseline parameters are present and exact."""
        params = get_authoritative_tehri_parameters()
        param_dict = {p.parameter: p for p in params}

        # Baseline checks
        self.assertIn("dam_name", param_dict)
        self.assertEqual(param_dict["dam_name"].value, "Tehri Dam")

        self.assertIn("river", param_dict)
        self.assertEqual(param_dict["river"].value, "Bhagirathi River")

        self.assertIn("dam_type", param_dict)
        self.assertEqual(param_dict["dam_type"].value, "Earth and Rockfill Dam")

        self.assertIn("dam_height", param_dict)
        self.assertEqual(param_dict["dam_height"].value, 260.5)
        self.assertEqual(param_dict["dam_height"].unit, "m")

        self.assertIn("dam_top_length", param_dict)
        self.assertEqual(param_dict["dam_top_length"].value, 575.0)

        self.assertIn("gross_storage", param_dict)
        self.assertEqual(param_dict["gross_storage"].value, 3540.0)

        self.assertIn("live_storage", param_dict)
        self.assertEqual(param_dict["live_storage"].value, 2615.0)

        self.assertIn("mddl", param_dict)
        self.assertEqual(param_dict["mddl"].value, 740.0)

        self.assertIn("frl", param_dict)
        self.assertEqual(param_dict["frl"].value, 830.0)

        self.assertIn("pmf_discharge_capacity", param_dict)
        self.assertEqual(param_dict["pmf_discharge_capacity"].value, 15540.0)

        self.assertIn("hpp_total_capacity", param_dict)
        self.assertEqual(param_dict["hpp_total_capacity"].value, 1000.0)

        self.assertIn("hpp_generating_units", param_dict)
        self.assertEqual(param_dict["hpp_generating_units"].value, "4 × 250 MW Francis units")

    def test_02_provenance_and_verification_tagging(self):
        """Verify provenance tags (REAL, DERIVED, APPROXIMATE, REQUIRES_VERIFICATION)."""
        params = get_authoritative_tehri_parameters()
        param_dict = {p.parameter: p for p in params}

        # Official THDC values must be REAL + VERIFIED
        self.assertEqual(param_dict["dam_height"].provenance, "REAL")
        self.assertEqual(param_dict["dam_height"].verification_status, "VERIFIED")

        # Crest elevation derived from FRL + freeboard
        self.assertEqual(param_dict["crest_elevation"].provenance, "DERIVED")
        self.assertEqual(param_dict["crest_elevation"].verification_status, "PARTIALLY_VERIFIED")

        # Slopes require engineering verification
        self.assertEqual(param_dict["upstream_slope"].provenance, "REQUIRES_VERIFICATION")
        self.assertEqual(param_dict["upstream_slope"].verification_status, "REQUIRES_VERIFICATION")

        # Spillway crest elevation is approximate
        self.assertEqual(param_dict["spillway_crest_elevation"].provenance, "APPROXIMATE")
        self.assertEqual(param_dict["spillway_crest_elevation"].verification_status, "REQUIRES_VERIFICATION")

    def test_03_schema_compliance(self):
        """Validate Pydantic schema serialization and structure."""
        params = get_authoritative_tehri_parameters()
        for p in params:
            self.assertIsInstance(p, DamParameterSchema)
            self.assertGreaterEqual(p.confidence, 0.0)
            self.assertLessEqual(p.confidence, 1.0)
            self.assertTrue(p.source.startswith("THDC") or p.source.startswith("CWC") or p.source.startswith("Froehlich"))

if __name__ == "__main__":
    unittest.main()
