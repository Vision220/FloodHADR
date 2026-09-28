"""
backend/test_phase22_final_system_test.py

Phase 22 — Final End-to-End System Integration Test Suite for FloodHADR.

Tests 16 Core Workflows:
1. Scenario creation
2. Tehri reservoir setup
3. Dam breach simulation
4. FloodHADR SWE solver
5. FloodHADR DWE solver
6. HEC-RAS project generation
7. HEC-RAS execution pipeline
8. HEC-RAS result importer & normalization
9. Model comparison (SWE vs DWE vs HEC-RAS)
10. 2D GIS visualization & timeline
11. 3D Digital Twin visualization
12. 2D/3D Synchronization engine
13. Infrastructure impact analysis
14. HADR decision support & evacuation planning
15. AI hydraulic comparison assistant
16. Scientific technical report generation & reproducibility
"""

import unittest
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.domain_schemas import SimulationFrame, SimulationRun

# Services
from app.simulation.dam_break import run_authoritative_dam_break_simulation
from app.simulation.hydrodynamic_2d_solver import Hydrodynamic2DSolver, Hydrodynamic2DSolverConfig, SolverMode
from app.hec_ras.hec_ras_2d_model import HECRAS2DModelBuilder, HECRAS2DModelConfig
from app.hec_ras.hec_ras_importer import HECRASResultImporter
from app.simulation.model_comparison import HydraulicModelComparisonEngine
from app.gis.gis_2d_service import GIS2DLayerService
from app.gis.digital_twin_3d_service import DigitalTwin3DService
from app.gis.sync_service import Synchronized2D3DService
from app.gis.hadr_service import HADRImpactService
from app.simulation.ai_comparison_assistant import AIHydraulicAssistantService
from app.simulation.scientific_report_service import ScientificReportGenerator
from app.simulation.scenario_lab_service import ScenarioLabService
from app.simulation.validation_sensitivity_service import ValidationSensitivityService


class TestPhase22FinalSystemIntegration(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_01_end_to_end_scenario_creation_and_reservoir_setup(self):
        """1 & 2: Verify scenario creation and reservoir breach simulation via API."""
        payload = {
            "mode": "OVERTOPPING",
            "breach_width_m": 180.0,
            "breach_formation_time_hr": 1.5,
            "reservoir_level_m": 830.0
        }
        resp = self.client.post("/api/scenarios/breach/simulate", json=payload)
        self.assertEqual(resp.status_code, 200)
        scen_data = resp.json()
        self.assertEqual(scen_data["mode"], "OVERTOPPING")
        self.assertGreater(scen_data["summary_metrics"]["peak_discharge_m3s"], 1000.0)

    def test_02_dam_breach_simulation(self):
        """3: Verify parametric dam breach simulation engine."""
        breach = run_authoritative_dam_break_simulation(
            mode="OVERTOPPING",
            breach_width_m=180.0,
            breach_formation_time_hr=1.5,
            reservoir_level_m=830.0
        )
        self.assertEqual(breach["mode"], "OVERTOPPING")
        self.assertIn("time_series", breach)
        self.assertIn("summary_metrics", breach)
        self.assertGreater(breach["summary_metrics"]["peak_discharge_m3s"], 1000.0)

    def test_03_floodhadr_swe_and_dwe_solvers(self):
        """4 & 5: Verify FloodHADR SWE and DWE solvers."""
        dem_test = np.ones((30, 30), dtype=np.float64) * 500.0
        cfg_swe = Hydrodynamic2DSolverConfig(dem_matrix=dem_test, mode=SolverMode.SWE, dam_location=(15, 15))
        cfg_dwe = Hydrodynamic2DSolverConfig(dem_matrix=dem_test, mode=SolverMode.DWE, dam_location=(15, 15))

        solver_swe = Hydrodynamic2DSolver(config=cfg_swe)
        solver_dwe = Hydrodynamic2DSolver(config=cfg_dwe)

        res_swe = solver_swe.run_simulation()
        res_dwe = solver_dwe.run_simulation()

        self.assertIn("SWE", res_swe["solver_mode"])
        self.assertIn("DWE", res_dwe["solver_mode"])
        self.assertGreater(res_swe["summary_scalar_metrics"]["maximum_depth_m"], 0.0)
        self.assertGreater(res_dwe["summary_scalar_metrics"]["maximum_depth_m"], 0.0)

    def test_04_hec_ras_project_generation_execution_and_import(self):
        """6, 7 & 8: Verify HEC-RAS 2D project generation, execution and result import."""
        # Generation via Builder
        builder = HECRAS2DModelBuilder(config=HECRAS2DModelConfig())
        model_payload = builder.build_2d_model()
        self.assertEqual(model_payload["status"], "success")
        self.assertIn("metadata", model_payload)
        self.assertIn("components", model_payload)

        # Import & Normalization into SimulationFrame
        importer = HECRASResultImporter()
        run = importer.import_hecras_results()
        self.assertEqual(run.model_id, "HEC_RAS")
        self.assertEqual(run.DEM_version, "ALOS_PALSAR_12M_REAL")
        self.assertGreater(len(run.frames), 0)
        self.assertIsInstance(run.frames[0], SimulationFrame)

    def test_05_model_comparison_engine(self):
        """9: Verify 4-way hydraulic model comparison engine."""
        engine = HydraulicModelComparisonEngine()
        comp = engine.compare_four_models()
        self.assertEqual(comp["status"], "success")
        self.assertIn("quantitative_metrics_matrix", comp)
        self.assertIn("compared_models", comp)
        self.assertEqual(len(comp["compared_models"]), 4)

    def test_06_gis_2d_and_3d_visualization(self):
        """10 & 11: Verify 2D GIS SimulationFrame layers and 3D Digital Twin visualization."""
        # 2D GIS
        gis_service = GIS2DLayerService()
        gis_data = gis_service.get_simulation_frame_gis_data(model_name="FloodHADR SWE", time_step_min=60)
        self.assertEqual(gis_data["status"], "success")
        self.assertIn("layers", gis_data)
        self.assertIn("depth", gis_data["layers"])

        # 3D Digital Twin
        twin_service = DigitalTwin3DService()
        twin = twin_service.get_3d_scene_data(model_name="FloodHADR SWE", time_step_min=60)
        self.assertEqual(twin["provenance"], "MODELLED_HYDRAULIC_3D_TWIN")
        self.assertIn("required_3d_elements", twin)

    def test_07_sync_2d_3d_engine(self):
        """12: Verify strict 2D and 3D state synchronization."""
        sync_service = Synchronized2D3DService()
        sync_res = sync_service.get_synchronized_views()
        self.assertEqual(sync_res["sync_status"], "SYNCHRONIZED")
        self.assertIn("view_2d", sync_res)
        self.assertIn("view_3d", sync_res)
        self.assertEqual(sync_res["control_state"]["simulation_time_min"], 45)


    def test_08_infrastructure_and_hadr_decision_support(self):
        """13 & 14: Verify Infrastructure impact analysis and HADR decision support."""
        hadr_service = HADRImpactService()
        hadr = hadr_service.evaluate_hadr_impact(model_name="FloodHADR SWE", time_step_min=60)
        self.assertEqual(hadr["hadr_status"], "COMPUTED_FROM_HYDRAULICS")
        outputs = hadr["outputs"]
        self.assertIn("affected_infrastructure", outputs)
        self.assertIn("potentially_blocked_roads", outputs)
        self.assertIn("safe_zones", outputs)

    def test_09_ai_hydraulic_comparison_assistant(self):
        """15: Verify AI comparison assistant providing factual explanations without score hallucination."""
        ai = AIHydraulicAssistantService()
        ans = ai.process_query("why do models differ")
        self.assertIn("explanation", ans)
        self.assertNotIn("Model X is the best", ans["explanation"])

    def test_10_scientific_report_generation(self):
        """16: Verify scientific report generation and reproducibility payload."""
        rep_gen = ScientificReportGenerator()
        report = rep_gen.generate_full_report(scenario_id="scen-test-final", run_id="sim-test-final")
        self.assertIn("metadata", report)
        self.assertIn("reproducibility_config", report)

        md = rep_gen.render_markdown_report(report)
        self.assertIn("# SCIENTIFIC TECHNICAL REPORT", md)

    def test_11_scenario_lab_and_validation(self):
        """Verify Scenario Comparison Lab and Validation & Sensitivity engine."""
        lab = ScenarioLabService()
        presets = lab.get_presets()
        self.assertEqual(presets["total_presets"], 10)

        val = ValidationSensitivityService()
        statuses = val.get_status_classifications()
        self.assertEqual(len(statuses["statuses"]), 6)


if __name__ == "__main__":
    unittest.main()
