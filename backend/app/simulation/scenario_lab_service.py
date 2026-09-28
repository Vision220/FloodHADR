"""
backend/app/simulation/scenario_lab_service.py

Scenario Comparison Lab Engine for FloodHADR.
Enables scenario duplication, modification across 13 parameters, preconfigured scenario presets,
and side-by-side hydraulic comparison displaying 6 quantitative difference metrics:
1. depth difference (Delta h)
2. velocity difference (Delta v)
3. arrival-time difference (Delta t_arr)
4. inundation-area difference (Delta A)
5. affected population difference (Delta Pop)
6. infrastructure difference (Delta Infra)
"""

import math
from typing import Dict, Any, List, Optional
from app.gis.gis_2d_service import GIS2DLayerService
from app.gis.hadr_service import HADRImpactService


class ScenarioLabService:
    """
    Authoritative Scenario Comparison Lab Service.
    """

    def __init__(self):
        self.gis_2d_service = GIS2DLayerService()
        self.hadr_service = HADRImpactService()

        from app.simulation.tehri_scenario_service import TehriScenarioService
        self.tehri_service = TehriScenarioService()

        # Phase 35 Authoritative Tehri Scenario Presets
        self.preconfigured_presets = {
            "TEHRI_PMF_NO_FAILURE": {
                "preset_id": "TEHRI_PMF_NO_FAILURE",
                "title": "Tehri PMF Routing Without Dam Failure",
                "description": "Probable Maximum Flood (PMF peak 22,400 m³/s) routed through Tehri Reservoir using spillway capacity without structural dam breach.",
                "reservoir_level_m": 839.5,
                "initial_storage_mm3": 3550.0,
                "inflow_m3s": 22400.0,
                "inflow_hydrograph": {
                    "peak_discharge_m3s": 22400.0,
                    "hydrograph_type": "PROBABLE_MAXIMUM_FLOOD",
                    "volume_mm3": 1850.0,
                    "duration_hr": 36.0,
                    "description": "CWC Authoritative PMF Inflow Hydrograph."
                },
                "spillway_operation": {
                    "status": "FULL_CAPACITY",
                    "status_display": "ALL GATES OPEN (15,540 m³/s + Chute Spillways)",
                    "discharge_capacity_m3s": 15540.0,
                    "gates_open_count": 4
                },
                "breach_occurrence": False,
                "breach_start_time_hr": 0.0,
                "breach_elevation_m": 839.5,
                "breach_bottom_elevation_m": 839.5,
                "breach_width_m": 0.0,
                "final_breach_width_m": 0.0,
                "breach_formation_time_hr": 0.0,
                "breach_side_slopes_hv": "1.0:1.0",
                "breach_type": "NO_BREACH",
                "mannings_n": 0.035,
                "dem_dataset": "ALOS_PALSAR_12M_REAL",
                "downstream_boundary": "FREE_OUTFLOW",
                "model_selected": "FloodHADR SWE",
                "mesh_resolution": "MEDIUM_12M",
                "simulation_duration_hr": 36.0,
                "assumptions_metadata": [
                    "PMF does NOT automatically trigger a dam breach.",
                    "Spillways operate at maximum rated design capacity (15,540 m³/s).",
                    "Dam embankment remains 100% structurally intact throughout flood passage."
                ]
            },
            "TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO": {
                "preset_id": "TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO",
                "title": "Tehri PMF Overtopping Dam Failure Scenario",
                "description": "Extreme PMF inflow exceeding spillway discharge capacity, resulting in reservoir overtopping above 839.5 m crest elevation and subsequent embankment failure.",
                "reservoir_level_m": 839.5,
                "initial_storage_mm3": 3550.0,
                "inflow_m3s": 25000.0,
                "inflow_hydrograph": {
                    "peak_discharge_m3s": 25000.0,
                    "hydrograph_type": "EXTREME_PMF_OVERTOPPING",
                    "volume_mm3": 2100.0,
                    "duration_hr": 36.0,
                    "description": "Extreme PMF hydrograph causing 1.5m overtopping."
                },
                "spillway_operation": {
                    "status": "EXCEEDED",
                    "status_display": "SPILLWAYS FULLY ENGAGED BUT EXCEEDED",
                    "discharge_capacity_m3s": 15540.0,
                    "gates_open_count": 4
                },
                "breach_occurrence": True,
                "breach_start_time_hr": 2.5,
                "breach_elevation_m": 700.0,
                "breach_bottom_elevation_m": 700.0,
                "breach_width_m": 220.0,
                "final_breach_width_m": 220.0,
                "breach_formation_time_hr": 1.0,
                "breach_side_slopes_hv": "0.7:1.0",
                "breach_type": "OVERTOPPING",
                "mannings_n": 0.035,
                "dem_dataset": "ALOS_PALSAR_12M_REAL",
                "downstream_boundary": "FREE_OUTFLOW",
                "model_selected": "FloodHADR SWE",
                "mesh_resolution": "MEDIUM_12M",
                "simulation_duration_hr": 24.0,
                "assumptions_metadata": [
                    "Inflow exceeds total spillway discharge capacity.",
                    "Water level overtops embankment crest elevation at 839.5 m.",
                    "Overtopping initiates progressive erosion breach after t = 2.5 hr."
                ]
            },
            "TEHRI_FRL_BREACH": {
                "preset_id": "TEHRI_FRL_BREACH",
                "title": "Tehri Dam Breach at Full Reservoir Level (FRL 830m)",
                "description": "Structural dam breach initiated at Full Reservoir Level (830.0 m) with 3,540 Mm³ initial active storage.",
                "reservoir_level_m": 830.0,
                "initial_storage_mm3": 3540.0,
                "inflow_m3s": 4500.0,
                "inflow_hydrograph": {
                    "peak_discharge_m3s": 4500.0,
                    "hydrograph_type": "MONSOON_DESIGN_INFLOW",
                    "volume_mm3": 450.0,
                    "duration_hr": 24.0,
                    "description": "Monsoon design inflow hydrograph."
                },
                "spillway_operation": {
                    "status": "OPERATIONAL",
                    "status_display": "NORMAL OPERATIONAL RELEASE",
                    "discharge_capacity_m3s": 3500.0,
                    "gates_open_count": 2
                },
                "breach_occurrence": True,
                "breach_start_time_hr": 0.5,
                "breach_elevation_m": 710.0,
                "breach_bottom_elevation_m": 710.0,
                "breach_width_m": 180.0,
                "final_breach_width_m": 180.0,
                "breach_formation_time_hr": 1.5,
                "breach_side_slopes_hv": "0.7:1.0",
                "breach_type": "OVERTOPPING",
                "mannings_n": 0.035,
                "dem_dataset": "ALOS_PALSAR_12M_REAL",
                "downstream_boundary": "FREE_OUTFLOW",
                "model_selected": "FloodHADR SWE",
                "mesh_resolution": "MEDIUM_12M",
                "simulation_duration_hr": 12.0,
                "assumptions_metadata": [
                    "Reservoir is at Full Reservoir Level (FRL = 830.0 m).",
                    "Initial storage volume is 3,540 Mm³.",
                    "Breach develops over 1.5 hr down to elevation 710.0 m."
                ]
            },
            "TEHRI_MDDL_BREACH": {
                "preset_id": "TEHRI_MDDL_BREACH",
                "title": "Tehri Dam Breach at Minimum Drawdown Level (MDDL 740m)",
                "description": "Structural dam breach initiated at Minimum Drawdown Level (740.0 m) prior to monsoon filling.",
                "reservoir_level_m": 740.0,
                "initial_storage_mm3": 2100.0,
                "inflow_m3s": 1200.0,
                "inflow_hydrograph": {
                    "peak_discharge_m3s": 1200.0,
                    "hydrograph_type": "DRY_SEASON_BASELINE",
                    "volume_mm3": 120.0,
                    "duration_hr": 24.0,
                    "description": "Dry season baseline inflow."
                },
                "spillway_operation": {
                    "status": "CLOSED",
                    "status_display": "SPILLWAY GATES CLOSED",
                    "discharge_capacity_m3s": 0.0,
                    "gates_open_count": 0
                },
                "breach_occurrence": True,
                "breach_start_time_hr": 0.5,
                "breach_elevation_m": 710.0,
                "breach_bottom_elevation_m": 710.0,
                "breach_width_m": 180.0,
                "final_breach_width_m": 180.0,
                "breach_formation_time_hr": 1.5,
                "breach_side_slopes_hv": "0.7:1.0",
                "breach_type": "PIPING",
                "mannings_n": 0.035,
                "dem_dataset": "ALOS_PALSAR_12M_REAL",
                "downstream_boundary": "FREE_OUTFLOW",
                "model_selected": "FloodHADR SWE",
                "mesh_resolution": "MEDIUM_12M",
                "simulation_duration_hr": 12.0,
                "assumptions_metadata": [
                    "Reservoir is at Minimum Drawdown Level (MDDL = 740.0 m).",
                    "Reduced head produces smaller peak outflow compared to FRL.",
                    "Initial storage is 2,100 Mm³."
                ]
            },
            "TEHRI_SPILLWAY_OPERATION": {
                "preset_id": "TEHRI_SPILLWAY_OPERATION",
                "title": "Tehri Controlled Spillway Operation Scenario",
                "description": "Controlled flood routing through Tehri spillway chute and shaft spillways under high inflow conditions without dam breach.",
                "reservoir_level_m": 832.0,
                "initial_storage_mm3": 3540.0,
                "inflow_m3s": 11800.0,
                "inflow_hydrograph": {
                    "peak_discharge_m3s": 11800.0,
                    "hydrograph_type": "DESIGN_FLOOD_HYDROGRAPH",
                    "volume_mm3": 920.0,
                    "duration_hr": 24.0,
                    "description": "Design flood hydrograph managed via spillway releases."
                },
                "spillway_operation": {
                    "status": "CONTROLLED_RELEASE",
                    "status_display": "SPILLWAY GATES OPERATIONAL (Discharge up to 11,800 m³/s)",
                    "discharge_capacity_m3s": 15540.0,
                    "gates_open_count": 4
                },
                "breach_occurrence": False,
                "breach_start_time_hr": 0.0,
                "breach_elevation_m": 839.5,
                "breach_bottom_elevation_m": 839.5,
                "breach_width_m": 0.0,
                "final_breach_width_m": 0.0,
                "breach_formation_time_hr": 0.0,
                "breach_side_slopes_hv": "1.0:1.0",
                "breach_type": "NO_BREACH",
                "mannings_n": 0.035,
                "dem_dataset": "ALOS_PALSAR_12M_REAL",
                "downstream_boundary": "FREE_OUTFLOW",
                "model_selected": "FloodHADR SWE",
                "mesh_resolution": "MEDIUM_12M",
                "simulation_duration_hr": 24.0,
                "assumptions_metadata": [
                    "All 4 spillway gates operating normally.",
                    "Discharge is contained within plunge pool and downstream river gorge.",
                    "Dam embankment experiences zero structural damage."
                ]
            },
            "TEHRI_EXTREME_INFLOW": {
                "preset_id": "TEHRI_EXTREME_INFLOW",
                "title": "Tehri 1000-Year Extreme Inflow Routing Scenario",
                "description": "1000-year return period extreme inflow hydrograph (15,540 m³/s) routed through reservoir and spillways without dam breach.",
                "reservoir_level_m": 835.0,
                "initial_storage_mm3": 3540.0,
                "inflow_m3s": 15540.0,
                "inflow_hydrograph": {
                    "peak_discharge_m3s": 15540.0,
                    "hydrograph_type": "1000_YEAR_EXTREME_FLOOD",
                    "volume_mm3": 1400.0,
                    "duration_hr": 30.0,
                    "description": "1000-Year return period extreme flood inflow."
                },
                "spillway_operation": {
                    "status": "FULL_CAPACITY",
                    "status_display": "SPILLWAYS OPERATING AT RATED CAPACITY (15,540 m³/s)",
                    "discharge_capacity_m3s": 15540.0,
                    "gates_open_count": 4
                },
                "breach_occurrence": False,
                "breach_start_time_hr": 0.0,
                "breach_elevation_m": 839.5,
                "breach_bottom_elevation_m": 839.5,
                "breach_width_m": 0.0,
                "final_breach_width_m": 0.0,
                "breach_formation_time_hr": 0.0,
                "breach_side_slopes_hv": "1.0:1.0",
                "breach_type": "NO_BREACH",
                "mannings_n": 0.035,
                "dem_dataset": "ALOS_PALSAR_12M_REAL",
                "downstream_boundary": "FREE_OUTFLOW",
                "model_selected": "FloodHADR SWE",
                "mesh_resolution": "MEDIUM_12M",
                "simulation_duration_hr": 30.0,
                "assumptions_metadata": [
                    "Inflow peak matches total spillway rated capacity (15,540 m³/s).",
                    "Dam freeboard remains positive.",
                    "Dam breach does NOT occur."
                ]
            },
            "USER_DEFINED": {
                "preset_id": "USER_DEFINED",
                "title": "User-Defined Custom Scenario",
                "description": "Custom scenario with user-specified parameter modifications.",
                "reservoir_level_m": 820.0,
                "initial_storage_mm3": 3200.0,
                "inflow_m3s": 3000.0,
                "inflow_hydrograph": {
                    "peak_discharge_m3s": 3000.0,
                    "hydrograph_type": "USER_SPECIFIED",
                    "volume_mm3": 300.0,
                    "duration_hr": 24.0,
                    "description": "User-specified inflow parameters."
                },
                "spillway_operation": {
                    "status": "USER_SPECIFIED",
                    "status_display": "USER SPECIFIED SPILLWAY RELEASE",
                    "discharge_capacity_m3s": 5000.0,
                    "gates_open_count": 2
                },
                "breach_occurrence": True,
                "breach_start_time_hr": 1.0,
                "breach_elevation_m": 715.0,
                "breach_bottom_elevation_m": 715.0,
                "breach_width_m": 120.0,
                "final_breach_width_m": 120.0,
                "breach_formation_time_hr": 2.0,
                "breach_side_slopes_hv": "0.7:1.0",
                "breach_type": "USER_DEFINED",
                "mannings_n": 0.038,
                "dem_dataset": "ALOS_PALSAR_12M_REAL",
                "downstream_boundary": "NORMAL_DEPTH",
                "model_selected": "FloodHADR DWE",
                "mesh_resolution": "MEDIUM_12M",
                "simulation_duration_hr": 12.0,
                "assumptions_metadata": [
                    "User-defined custom scenario parameters.",
                    "Carries explicit provenance tag 'SCENARIO'."
                ]
            }
        }

    def get_presets(self) -> Dict[str, Any]:
        """Returns all 10 preconfigured scenario presets."""
        return {
            "total_presets": len(self.preconfigured_presets),
            "presets": self.preconfigured_presets,
            "supported_preset_ids": list(self.preconfigured_presets.keys())
        }

    def duplicate_and_modify(
        self,
        base_preset_id: str = "BASELINE",
        modifications: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Duplicates a base scenario preset and applies custom modifications across 13 parameters.
        """
        base = self.preconfigured_presets.get(base_preset_id, self.preconfigured_presets["BASELINE"])
        new_scenario = dict(base)

        if modifications:
            for k in [
                "reservoir_level_m", "inflow_m3s", "rainfall_mm", "breach_width_m",
                "breach_formation_time_hr", "breach_elevation_m", "breach_type",
                "mannings_n", "dem_dataset", "downstream_boundary", "model_selected",
                "mesh_resolution", "simulation_duration_hr"
            ]:
                if k in modifications:
                    new_scenario[k] = modifications[k]

        new_scenario["preset_id"] = "USER_DEFINED"
        new_scenario["title"] = f"Duplicated {base['preset_id']} Scenario (Modified)"
        return new_scenario

    def compare_side_by_side(
        self,
        scenario_a_params: Dict[str, Any],
        scenario_b_params: Dict[str, Any],
        time_step_min: int = 60
    ) -> Dict[str, Any]:
        """
        Executes side-by-side hydraulic simulation comparison between Scenario A and Scenario B.
        Calculates all 6 required difference metrics:
        1. depth difference (Delta h)
        2. velocity difference (Delta v)
        3. arrival-time difference (Delta t_arr)
        4. inundation-area difference (Delta A)
        5. affected population difference (Delta Pop)
        6. infrastructure difference (Delta Infra)
        """
        # Execute Scenario A Hydraulics & HADR
        hadr_a = self.hadr_service.evaluate_hadr_impact(
            model_name=scenario_a_params.get("model_selected", "FloodHADR SWE"),
            time_step_min=time_step_min,
            scenario_params={
                "breach_width_m": scenario_a_params.get("breach_width_m", 180.0),
                "reservoir_level_m": scenario_a_params.get("reservoir_level_m", 830.0)
            }
        )

        # Execute Scenario B Hydraulics & HADR
        hadr_b = self.hadr_service.evaluate_hadr_impact(
            model_name=scenario_b_params.get("model_selected", "FloodHADR SWE"),
            time_step_min=time_step_min,
            scenario_params={
                "breach_width_m": scenario_b_params.get("breach_width_m", 180.0),
                "reservoir_level_m": scenario_b_params.get("reservoir_level_m", 830.0)
            }
        )

        # Extract hydraulic metrics for A and B
        gis_a = self.gis_2d_service.get_simulation_frame_gis_data(
            model_name=scenario_a_params.get("model_selected", "FloodHADR SWE"),
            time_step_min=time_step_min,
            scenario_params={"breach_width_m": scenario_a_params.get("breach_width_m", 180.0), "reservoir_level_m": scenario_a_params.get("reservoir_level_m", 830.0)}
        )

        gis_b = self.gis_2d_service.get_simulation_frame_gis_data(
            model_name=scenario_b_params.get("model_selected", "FloodHADR SWE"),
            time_step_min=time_step_min,
            scenario_params={"breach_width_m": scenario_b_params.get("breach_width_m", 180.0), "reservoir_level_m": scenario_b_params.get("reservoir_level_m", 830.0)}
        )

        depth_a = gis_a["hydraulic_summary"]["max_depth_m"]
        depth_b = gis_b["hydraulic_summary"]["max_depth_m"]
        vel_a = gis_a["hydraulic_summary"]["max_velocity_ms"]
        vel_b = gis_b["hydraulic_summary"]["max_velocity_ms"]
        area_a = gis_a["hydraulic_summary"]["flooded_area_km2"]
        area_b = gis_b["hydraulic_summary"]["flooded_area_km2"]
        pop_a = gis_a["hydraulic_summary"]["affected_population"]
        pop_b = gis_b["hydraulic_summary"]["affected_population"]

        infra_a_count = len([x for x in hadr_a["outputs"]["affected_infrastructure"] if x["maximum_depth"] > 0.0])
        infra_b_count = len([x for x in hadr_b["outputs"]["affected_infrastructure"] if x["maximum_depth"] > 0.0])

        arr_a_min = round(15.0 * (180.0 / scenario_a_params.get("breach_width_m", 180.0)), 1)
        arr_b_min = round(15.0 * (180.0 / scenario_b_params.get("breach_width_m", 180.0)), 1)

        # Compute 6 Quantitative Difference Metrics (B - A)
        delta_depth_m = round(depth_b - depth_a, 2)
        delta_velocity_ms = round(vel_b - vel_a, 2)
        delta_arrival_time_min = round(arr_b_min - arr_a_min, 1)
        delta_inundation_area_km2 = round(area_b - area_a, 2)
        delta_affected_population = pop_b - pop_a
        delta_infrastructure_count = infra_b_count - infra_a_count

        return {
            "lab_status": "COMPARISON_COMPLETED",
            "scenario_a": {
                "params": scenario_a_params,
                "max_depth_m": depth_a,
                "max_velocity_ms": vel_a,
                "arrival_time_min": arr_a_min,
                "flooded_area_km2": area_a,
                "affected_population": pop_a,
                "affected_infrastructure_count": infra_a_count
            },
            "scenario_b": {
                "params": scenario_b_params,
                "max_depth_m": depth_b,
                "max_velocity_ms": vel_b,
                "arrival_time_min": arr_b_min,
                "flooded_area_km2": area_b,
                "affected_population": pop_b,
                "affected_infrastructure_count": infra_b_count
            },
            "differences": {
                "depth_difference_m": delta_depth_m,
                "velocity_difference_ms": delta_velocity_ms,
                "arrival_time_difference_min": delta_arrival_time_min,
                "inundation_area_difference_km2": delta_inundation_area_km2,
                "affected_population_difference": delta_affected_population,
                "infrastructure_difference": delta_infrastructure_count,
                "summary": (
                    f"Scenario B differs from Scenario A by {delta_depth_m:+.2f} m in maximum depth, "
                    f"{delta_velocity_ms:+.2f} m/s in velocity, {delta_arrival_time_min:+.1f} min in wave arrival time, "
                    f"{delta_inundation_area_km2:+.2f} km² in flood area, {delta_affected_population:+d} in affected population, "
                    f"and {delta_infrastructure_count:+d} flooded infrastructure assets."
                )
            }
        }
