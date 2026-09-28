"""
backend/test_phase32_parameter_responsive_3d_flood.py

Automated Test Suite for Phase 32: Parameter-Responsive 3D Flood Engine.
Tests all 8 mandatory parameters:
  1. Reservoir level
  2. Breach width
  3. Breach formation time
  4. Breach elevation
  5. Manning roughness
  6. Rainfall/inflow scenario
  7. Hydraulic model (FloodHADR SWE, FloodHADR DWE, HEC-RAS SWE, HEC-RAS DWE)
  8. Simulation duration

Proves that Scenario A (FRL + narrow breach) vs Scenario B (FRL + wide breach) produces
measurably different spatial hydrodynamics (depth matrix, WSE matrix, velocity matrix,
inundation extent, virtual gauges, HADR impact, scenario ID).
Fails if only UI display strings change without physical matrix/geometry differences.
"""

import unittest
from app.gis.gis_2d_service import GIS2DLayerService
from app.gis.digital_twin_3d_service import DigitalTwin3DService
from app.gis.sync_service import Synchronized2D3DService
from app.gis.hadr_service import HADRImpactService


class TestPhase32ParameterResponsive3DFlood(unittest.TestCase):

    def setUp(self):
        self.gis_service = GIS2DLayerService()
        self.dt_service = DigitalTwin3DService()
        self.sync_service = Synchronized2D3DService()
        self.hadr_service = HADRImpactService()

    def test_01_scenario_a_vs_scenario_b_physical_difference(self):
        """
        MANDATORY PROMPT TEST:
        Scenario A: FRL (830m) + narrow breach (60m)
        Scenario B: FRL (830m) + wide breach (300m)
        Must produce measurably different hydrographs, spatial matrices, virtual gauge stages, and HADR impact.
        Fails if only display numbers change.
        """
        params_a = {
            "reservoir_level_m": 830.0,
            "breach_width_m": 60.0,
            "formation_time_hr": 1.5,
            "breach_elevation_m": 600.0,
            "mannings_n": 0.035,
            "rainfall_scenario": "NORMAL",
            "model_selected": "FloodHADR SWE",
            "simulation_duration_hr": 6.0
        }

        params_b = {
            "reservoir_level_m": 830.0,
            "breach_width_m": 300.0,
            "formation_time_hr": 1.5,
            "breach_elevation_m": 600.0,
            "mannings_n": 0.035,
            "rainfall_scenario": "NORMAL",
            "model_selected": "FloodHADR SWE",
            "simulation_duration_hr": 6.0
        }

        # Retrieve 2D GIS and 3D Digital Twin payloads for both scenarios
        gis_a = self.gis_service.get_simulation_frame_gis_data(model_name="FloodHADR SWE", time_step_min=60, scenario_params=params_a)
        gis_b = self.gis_service.get_simulation_frame_gis_data(model_name="FloodHADR SWE", time_step_min=60, scenario_params=params_b)

        payload_a = self.dt_service.get_3d_scene_data(model_name="FloodHADR SWE", time_step_min=60, scenario_params=params_a)
        payload_b = self.dt_service.get_3d_scene_data(model_name="FloodHADR SWE", time_step_min=60, scenario_params=params_b)

        # 1. Unique Scenario ID check
        scen_id_a = gis_a["scenario_id"]
        scen_id_b = gis_b["scenario_id"]
        self.assertNotEqual(scen_id_a, scen_id_b, "Scenario A and Scenario B must produce unique Scenario IDs")

        # 2. Peak discharge difference
        q_a = gis_a["hydraulic_summary"]["peak_discharge_m3s"]
        q_b = gis_b["hydraulic_summary"]["peak_discharge_m3s"]
        self.assertGreater(q_b, q_a * 2.0, "Wide breach must produce > 2x peak discharge of narrow breach")

        # 3. Maximum depth and inundation area physical differences
        d_a = gis_a["hydraulic_summary"]["max_depth_m"]
        d_b = gis_b["hydraulic_summary"]["max_depth_m"]
        area_a = gis_a["hydraulic_summary"]["flooded_area_km2"]
        area_b = gis_b["hydraulic_summary"]["flooded_area_km2"]

        self.assertGreater(d_b, d_a + 2.0, "Scenario B depth must be physically deeper than Scenario A")
        self.assertGreater(area_b, area_a * 1.5, "Scenario B flood extent must be physically larger than Scenario A")

        # 4. 3D Water Depth Matrix & WSE Matrix spatial sum differences
        matrix_depth_a = payload_a["simulation_frame"]["water_depth"]
        matrix_depth_b = payload_b["simulation_frame"]["water_depth"]
        sum_depth_a = sum(sum(row) for row in matrix_depth_a)
        sum_depth_b = sum(sum(row) for row in matrix_depth_b)

        self.assertGreater(sum_depth_b, sum_depth_a * 1.5, "Scenario B 3D depth matrix sum must exceed Scenario A")

        matrix_wse_a = payload_a["simulation_frame"]["water_surface_elevation"]
        matrix_wse_b = payload_b["simulation_frame"]["water_surface_elevation"]
        sum_wse_a = sum(sum(row) for row in matrix_wse_a)
        sum_wse_b = sum(sum(row) for row in matrix_wse_b)

        self.assertGreater(sum_wse_b, sum_wse_a, "Scenario B 3D WSE matrix sum must exceed Scenario A")

        # 5. Virtual Gauge stage and flow differences
        gauge_devprayag_a = [g for g in gis_a["virtual_gauges"] if g["gauge_id"] == "gauge-devprayag"][0]
        gauge_devprayag_b = [g for g in gis_b["virtual_gauges"] if g["gauge_id"] == "gauge-devprayag"][0]
        self.assertGreater(gauge_devprayag_b["stage_m"], gauge_devprayag_a["stage_m"], "Devprayag virtual gauge stage must be higher in Scenario B")

        # 6. HADR Impact differences
        hadr_a = self.hadr_service.evaluate_hadr_impact(model_name="FloodHADR SWE", time_step_min=60, scenario_params=params_a)
        hadr_b = self.hadr_service.evaluate_hadr_impact(model_name="FloodHADR SWE", time_step_min=60, scenario_params=params_b)

        blocked_a = len(hadr_a["outputs"]["potentially_blocked_roads"])
        blocked_b = len(hadr_b["outputs"]["potentially_blocked_roads"])
        self.assertGreaterEqual(blocked_b, blocked_a, "Scenario B HADR blocked roads must be >= Scenario A")

    def test_02_all_8_parameters_responsiveness(self):
        """Tests that changing each of the 8 parameters individually alters the hydraulic output."""
        base_params = {
            "reservoir_level_m": 830.0,
            "breach_width_m": 180.0,
            "formation_time_hr": 1.5,
            "breach_elevation_m": 600.0,
            "mannings_n": 0.035,
            "rainfall_scenario": "NORMAL",
            "model_selected": "FloodHADR SWE",
            "simulation_duration_hr": 6.0
        }
        base_res = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 60, base_params)

        # 1. Reservoir Level Change (740m MDDL vs 830m FRL)
        p_res = dict(base_params, reservoir_level_m=740.0)
        res_740 = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 60, p_res)
        self.assertLess(res_740["hydraulic_summary"]["max_depth_m"], base_res["hydraulic_summary"]["max_depth_m"])

        # 2. Breach Width Change (60m vs 180m)
        p_w = dict(base_params, breach_width_m=60.0)
        res_w = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 60, p_w)
        self.assertLess(res_w["hydraulic_summary"]["peak_discharge_m3s"], base_res["hydraulic_summary"]["peak_discharge_m3s"])

        # 3. Breach Formation Time Change (0.5h vs 3.0h)
        p_tf_fast = dict(base_params, formation_time_hr=0.5)
        p_tf_slow = dict(base_params, formation_time_hr=3.0)
        res_fast = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 60, p_tf_fast)
        res_slow = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 60, p_tf_slow)
        self.assertGreater(res_fast["hydraulic_summary"]["peak_discharge_m3s"], res_slow["hydraulic_summary"]["peak_discharge_m3s"])

        # 4. Breach Elevation Change (600m vs 720m)
        p_elev = dict(base_params, breach_elevation_m=720.0)
        res_elev = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 60, p_elev)
        self.assertLess(res_elev["hydraulic_summary"]["max_depth_m"], base_res["hydraulic_summary"]["max_depth_m"])

        # 5. Manning Roughness Change (0.020 smooth vs 0.060 rough)
        p_smooth = dict(base_params, mannings_n=0.020)
        p_rough = dict(base_params, mannings_n=0.060)
        res_smooth = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 60, p_smooth)
        res_rough = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 60, p_rough)
        self.assertGreater(res_smooth["hydraulic_summary"]["max_velocity_ms"], res_rough["hydraulic_summary"]["max_velocity_ms"])

        # 6. Rainfall Scenario Change (NORMAL vs COMPOUND_CLOUD_BURST)
        p_rain = dict(base_params, rainfall_scenario="COMPOUND_CLOUD_BURST")
        res_rain = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 60, p_rain)
        self.assertGreater(res_rain["hydraulic_summary"]["peak_discharge_m3s"], base_res["hydraulic_summary"]["peak_discharge_m3s"])

        # 7. Hydraulic Model Change (FloodHADR SWE vs FloodHADR DWE)
        res_swe = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 60, base_params)
        res_dwe = self.gis_service.get_simulation_frame_gis_data("FloodHADR DWE", 60, base_params)
        self.assertGreater(res_swe["hydraulic_summary"]["max_velocity_ms"], res_dwe["hydraulic_summary"]["max_velocity_ms"])

        # 8. Simulation Duration Change (3.0h vs 12.0h)
        p_dur_short = dict(base_params, simulation_duration_hr=3.0)
        p_dur_long = dict(base_params, simulation_duration_hr=12.0)
        res_short = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 180, p_dur_short)
        res_long = self.gis_service.get_simulation_frame_gis_data("FloodHADR SWE", 180, p_dur_long)
        self.assertNotEqual(res_short["hydraulic_summary"]["max_depth_m"], res_long["hydraulic_summary"]["max_depth_m"])

    def test_03_scenario_id_generation_and_sync(self):
        """Verifies unique scenario ID generation and master state synchronization."""
        params_c = {"reservoir_level_m": 835.0, "breach_width_m": 250.0, "formation_time_hr": 1.0}
        sync_res = self.sync_service.set_scenario("SCEN_CUSTOM_TEST", params_c)

        self.assertEqual(sync_res["sync_status"], "SYNCHRONIZED")
        self.assertEqual(sync_res["control_state"]["scenario_params"]["breach_width_m"], 250.0)
        self.assertIn("view_2d", sync_res)
        self.assertIn("view_3d", sync_res)


if __name__ == "__main__":
    unittest.main()
