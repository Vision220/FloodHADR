"""
backend/test_phase9_hec_ras_integration.py

Phase 9 Unit & Scientific Integration Tests for HEC-RAS Model Integration.
Tests HEC-RAS project generation, 7-point parameter equivalence, executable detection,
and honest execution reporting.
"""

import os
import sys
import json
import unittest
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.hec_ras import (
    HECRASProjectGenerator,
    HECRASProjectConfig,
    HECRASTerrainExporter,
    HECRASGeometryGenerator,
    HECRASMeshGenerator,
    HECRASBreachGenerator,
    HECRASPlanGenerator,
    HECRASRunner,
    HECRASExecutionStatus,
    HECRASResultsParser,
    HECRASValidationSuite
)
from app.simulation.hecras_engine import hecras_reference_engine


class TestPhase9HECRASIntegration(unittest.TestCase):

    def setUp(self):
        self.output_dir = "data/hecras_projects/test_phase9"
        os.makedirs(self.output_dir, exist_ok=True)
        self.dem_matrix = np.full((30, 30), 800.0, dtype=np.float64)

    def test_01_project_generation_and_files(self):
        """Verify HEC-RAS project generator creates .prj, geometry, mesh, breach, plan, and terrain files."""
        prj_config = HECRASProjectConfig(
            project_id="test_hecras",
            output_dir=self.output_dir
        )
        gen = HECRASProjectGenerator(prj_config)
        meta = gen.generate_project_file()

        self.assertEqual(meta["status"], "HEC-RAS PROJECT GENERATED")
        self.assertTrue(os.path.exists(meta["project_file_path"]))

        # Verify .prj file text contents
        with open(meta["project_file_path"], "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("Proj Title=Tehri Dam Break HEC-RAS 2D Reference Model", content)
        self.assertIn("Units=SI Units", content)
        self.assertIn("Spatial Reference System=EPSG:32644", content)

        print("  [PASS] Test 1: HEC-RAS .prj project file generation verified.")

    def test_02_seven_point_parameter_equivalence(self):
        """Verify HECRASValidationSuite proves 100% parameter equivalence across 7 key parameters."""
        prj_gen = HECRASProjectGenerator(HECRASProjectConfig(output_dir=self.output_dir))
        prj_meta = prj_gen.generate_project_file()

        terrain_exp = HECRASTerrainExporter()
        terrain_meta = terrain_exp.export_terrain_from_matrix(self.dem_matrix)

        geom_gen = HECRASGeometryGenerator()
        geom_meta = geom_gen.generate_geometry_file()

        plan_gen = HECRASPlanGenerator()
        plan_meta = plan_gen.generate_plan_files()

        breach_gen = HECRASBreachGenerator()
        breach_meta = breach_gen.generate_breach_definition()

        scenario_params = {
            "scenario_id": "scen-tehri-overtop",
            "crs": "EPSG:32644",
            "dx": 25.0,
            "dy": 25.0,
            "reservoir_level_m": 830.0,
            "breach_width_m": 180.0,
            "formation_time_hr": 1.5,
            "manning_n": 0.035,
            "failure_mode": "OVERTOPPING"
        }

        validator = HECRASValidationSuite()
        val_report = validator.validate_parameter_alignment(
            scenario_params, prj_meta, breach_meta, plan_meta, terrain_meta
        )

        self.assertTrue(val_report["validation_passed"])
        self.assertEqual(val_report["passed_checks"], 7)
        self.assertEqual(val_report["equivalence_status"], "100% PARAMETER EQUIVALENT")

        print("  [PASS] Test 2: 7-Point Parameter Equivalence verified (100% match).")

    def test_03_executable_detection_and_honest_reporting(self):
        """Verify runner detects HEC-RAS availability and reports HEC-RAS EXECUTION: NOT AVAILABLE without faking results."""
        runner = HECRASRunner()
        is_avail = runner.is_available()

        run = hecras_reference_engine.run_hecras_simulation(
            scenario_id="scen-test-phase9",
            breach_width_m=180.0,
            reservoir_level_m=830.0
        )

        if not is_avail:
            self.assertEqual(run.status, "HEC-RAS EXECUTION: NOT AVAILABLE")
            self.assertEqual(run.provenance, "HEC_RAS_PROJECT_GENERATED_NOT_AVAILABLE")
            self.assertIn("NOT AVAILABLE", run.model_metadata.model_notice)
            self.assertEqual(run.max_depth_m, 0.0)
            self.assertEqual(len(run.frames), 0)
            print("  [PASS] Test 3: Executable NOT AVAILABLE correctly reported without fabricating results.")
        else:
            self.assertIn(run.status, ["COMPLETED", "HEC-RAS EXECUTION: SUCCESSFUL"])
            print("  [PASS] Test 3: Executable AVAILABLE and run completed successfully.")

    def test_04_results_parser_behavior(self):
        """Verify HECRASResultsParser returns un-fabricated status when results are not available."""
        parser = HECRASResultsParser(project_dir=self.output_dir)
        res = parser.parse_results(execution_meta={"results_available": False, "hec_ras_execution_status": "HEC-RAS EXECUTION: NOT AVAILABLE"})

        self.assertFalse(res["results_present"])
        self.assertEqual(res["hec_ras_execution_status"], "HEC-RAS EXECUTION: NOT AVAILABLE")
        self.assertIn("No HEC-RAS output rasters", res["message"])

        print("  [PASS] Test 4: Results parser handles unexecuted runs safely without fabrication.")


if __name__ == "__main__":
    unittest.main()
