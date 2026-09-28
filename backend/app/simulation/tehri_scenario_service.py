"""
backend/app/simulation/tehri_scenario_service.py

Authoritative Tehri Flood & Dam-Break Scenario Management Service for FloodHADR (Phase 35).

CRITICAL MANDATES:
1. Explicitly separates:
   - PMF routing without dam failure (TEHRI_PMF_NO_FAILURE)
   - Dam overtopping failure scenario (TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO)
   - Breach failure scenario (TEHRI_FRL_BREACH, TEHRI_MDDL_BREACH)
   - Spillway operation scenario (TEHRI_SPILLWAY_OPERATION)
   - Extreme inflow scenario (TEHRI_EXTREME_INFLOW)
   - User-defined scenario (USER_DEFINED)

2. STRICT RULE: Does NOT automatically equate PMF = dam break.
3. Every scenario explicitly defines all 12 required parameters:
   - reservoir_level_m
   - initial_storage_mm3
   - inflow_hydrograph
   - spillway_operation
   - breach_occurrence (boolean)
   - breach_start_time_hr
   - breach_bottom_elevation_m
   - final_breach_width_m
   - breach_formation_time_hr
   - breach_side_slopes_hv
   - downstream_boundary
   - simulation_duration_hr

4. Clearly labels all assumptions metadata.
"""

from typing import Dict, Any, List, Optional
import math


class TehriScenarioService:
    """
    Authoritative Tehri Basin Flood & Dam-Break Scenario Management Engine.
    """

    def __init__(self):
        self.scenarios = {
            "TEHRI_PMF_NO_FAILURE": {
                "scenario_id": "TEHRI_PMF_NO_FAILURE",
                "scenario_name": "Tehri PMF Routing Without Dam Failure",
                "category": "PMF_NO_FAILURE",
                "description": "Probable Maximum Flood (PMF peak 22,400 m³/s) routed through Tehri Reservoir using spillway capacity without structural dam breach.",
                "reservoir_level_m": 839.5,
                "initial_storage_mm3": 3550.0,
                "inflow_hydrograph": {
                    "peak_discharge_m3s": 22400.0,
                    "hydrograph_type": "PROBABLE_MAXIMUM_FLOOD",
                    "volume_mm3": 1850.0,
                    "duration_hr": 36.0,
                    "description": "CWC Authoritative PMF Inflow Hydrograph for Bhagirathi Catchment."
                },
                "spillway_operation": {
                    "status": "FULL_CAPACITY",
                    "status_display": "ALL GATES OPEN (15,540 m³/s + Chute Spillways)",
                    "discharge_capacity_m3s": 15540.0,
                    "gates_open_count": 4
                },
                "breach_occurrence": False,
                "breach_start_time_hr": 0.0,
                "breach_bottom_elevation_m": 839.5,
                "final_breach_width_m": 0.0,
                "breach_formation_time_hr": 0.0,
                "breach_side_slopes_hv": "1.0:1.0",
                "downstream_boundary": "FREE_OUTFLOW",
                "simulation_duration_hr": 36.0,
                "assumptions_metadata": [
                    "PMF does NOT automatically trigger a dam breach.",
                    "Spillways operate at maximum rated design capacity (15,540 m³/s).",
                    "Dam embankment remains 100% structurally intact throughout flood passage.",
                    "Peak water surface elevation reaches crest level (839.5 m)."
                ]
            },
            "TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO": {
                "scenario_id": "TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO",
                "scenario_name": "Tehri PMF Overtopping Dam Failure Scenario",
                "category": "OVERTOPPING_FAILURE",
                "description": "Extreme PMF inflow exceeding spillway discharge capacity, resulting in reservoir overtopping above 839.5 m crest elevation and subsequent embankment failure.",
                "reservoir_level_m": 839.5,
                "initial_storage_mm3": 3550.0,
                "inflow_hydrograph": {
                    "peak_discharge_m3s": 25000.0,
                    "hydrograph_type": "EXTREME_PMF_OVERTOPPING",
                    "volume_mm3": 2100.0,
                    "duration_hr": 36.0,
                    "description": "Extreme PMF hydrograph causing 1.5m overtopping above dam crest."
                },
                "spillway_operation": {
                    "status": "EXCEEDED",
                    "status_display": "SPILLWAYS FULLY ENGAGED BUT EXCEEDED",
                    "discharge_capacity_m3s": 15540.0,
                    "gates_open_count": 4
                },
                "breach_occurrence": True,
                "breach_start_time_hr": 2.5,
                "breach_bottom_elevation_m": 700.0,
                "final_breach_width_m": 220.0,
                "breach_formation_time_hr": 1.0,
                "breach_side_slopes_hv": "0.7:1.0",
                "downstream_boundary": "FREE_OUTFLOW",
                "simulation_duration_hr": 24.0,
                "assumptions_metadata": [
                    "Inflow exceeds total spillway discharge capacity.",
                    "Water level overtops the embankment crest elevation at 839.5 m.",
                    "Overtopping initiates progressive erosion and breach formation after t = 2.5 hr."
                ]
            },
            "TEHRI_FRL_BREACH": {
                "scenario_id": "TEHRI_FRL_BREACH",
                "scenario_name": "Tehri Dam Breach at Full Reservoir Level (FRL 830m)",
                "category": "BREACH_FAILURE",
                "description": "Structural dam breach initiated at Full Reservoir Level (830.0 m) with 3,540 Mm³ initial active storage.",
                "reservoir_level_m": 830.0,
                "initial_storage_mm3": 3540.0,
                "inflow_hydrograph": {
                    "peak_discharge_m3s": 4500.0,
                    "hydrograph_type": "MONSOON_DESIGN_INFLOW",
                    "volume_mm3": 450.0,
                    "duration_hr": 24.0,
                    "description": "Standard monsoon inflow hydrograph into full reservoir pool."
                },
                "spillway_operation": {
                    "status": "OPERATIONAL",
                    "status_display": "NORMAL OPERATIONAL RELEASE",
                    "discharge_capacity_m3s": 3500.0,
                    "gates_open_count": 2
                },
                "breach_occurrence": True,
                "breach_start_time_hr": 0.5,
                "breach_bottom_elevation_m": 710.0,
                "final_breach_width_m": 180.0,
                "breach_formation_time_hr": 1.5,
                "breach_side_slopes_hv": "0.7:1.0",
                "downstream_boundary": "FREE_OUTFLOW",
                "simulation_duration_hr": 12.0,
                "assumptions_metadata": [
                    "Reservoir is at Full Reservoir Level (FRL = 830.0 m).",
                    "Initial storage is 3,540 Mm³.",
                    "Breach develops over 1.5 hr down to elevation 710.0 m."
                ]
            },
            "TEHRI_MDDL_BREACH": {
                "scenario_id": "TEHRI_MDDL_BREACH",
                "scenario_name": "Tehri Dam Breach at Minimum Drawdown Level (MDDL 740m)",
                "category": "BREACH_FAILURE",
                "description": "Structural dam breach initiated at Minimum Drawdown Level (740.0 m) prior to monsoon filling.",
                "reservoir_level_m": 740.0,
                "initial_storage_mm3": 2100.0,
                "inflow_hydrograph": {
                    "peak_discharge_m3s": 1200.0,
                    "hydrograph_type": "DRY_SEASON_BASELINE",
                    "volume_mm3": 120.0,
                    "duration_hr": 24.0,
                    "description": "Low dry-season inflow hydrograph."
                },
                "spillway_operation": {
                    "status": "CLOSED",
                    "status_display": "SPILLWAY GATES CLOSED",
                    "discharge_capacity_m3s": 0.0,
                    "gates_open_count": 0
                },
                "breach_occurrence": True,
                "breach_start_time_hr": 0.5,
                "breach_bottom_elevation_m": 710.0,
                "final_breach_width_m": 180.0,
                "breach_formation_time_hr": 1.5,
                "breach_side_slopes_hv": "0.7:1.0",
                "downstream_boundary": "FREE_OUTFLOW",
                "simulation_duration_hr": 12.0,
                "assumptions_metadata": [
                    "Reservoir is at Minimum Drawdown Level (MDDL = 740.0 m).",
                    "Reduced hydraulic head results in lower peak breach outflow compared to FRL.",
                    "Initial storage volume is 2,100 Mm³."
                ]
            },
            "TEHRI_SPILLWAY_OPERATION": {
                "scenario_id": "TEHRI_SPILLWAY_OPERATION",
                "scenario_name": "Tehri Controlled Spillway Operation Scenario",
                "category": "SPILLWAY_OPERATION",
                "description": "Controlled flood routing through Tehri spillway chute and shaft spillways under high inflow conditions without dam breach.",
                "reservoir_level_m": 832.0,
                "initial_storage_mm3": 3540.0,
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
                "breach_bottom_elevation_m": 839.5,
                "final_breach_width_m": 0.0,
                "breach_formation_time_hr": 0.0,
                "breach_side_slopes_hv": "1.0:1.0",
                "downstream_boundary": "FREE_OUTFLOW",
                "simulation_duration_hr": 24.0,
                "assumptions_metadata": [
                    "All 4 radial spillway gates are fully functional.",
                    "Discharge is controlled and contained within the spillway chute and downstream plunge pool.",
                    "Embankment dam structure experiences zero structural damage."
                ]
            },
            "TEHRI_EXTREME_INFLOW": {
                "scenario_id": "TEHRI_EXTREME_INFLOW",
                "scenario_name": "Tehri 1000-Year Extreme Inflow Routing Scenario",
                "category": "EXTREME_INFLOW",
                "description": "1000-year return period extreme inflow hydrograph (15,540 m³/s) routed through reservoir and spillways without dam breach.",
                "reservoir_level_m": 835.0,
                "initial_storage_mm3": 3540.0,
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
                "breach_bottom_elevation_m": 839.5,
                "final_breach_width_m": 0.0,
                "breach_formation_time_hr": 0.0,
                "breach_side_slopes_hv": "1.0:1.0",
                "downstream_boundary": "FREE_OUTFLOW",
                "simulation_duration_hr": 30.0,
                "assumptions_metadata": [
                    "Inflow peak equals total spillway rated design capacity (15,540 m³/s).",
                    "Freeboard remains positive (> 4.5 m below crest).",
                    "Dam breach does NOT occur."
                ]
            },
            "USER_DEFINED": {
                "scenario_id": "USER_DEFINED",
                "scenario_name": "User-Defined Custom Scenario",
                "category": "USER_DEFINED",
                "description": "Customizable scenario allowing complete user specification of all 12 hydraulic and structural parameters.",
                "reservoir_level_m": 820.0,
                "initial_storage_mm3": 3200.0,
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
                "breach_bottom_elevation_m": 715.0,
                "final_breach_width_m": 120.0,
                "breach_formation_time_hr": 2.0,
                "breach_side_slopes_hv": "0.7:1.0",
                "downstream_boundary": "NORMAL_DEPTH",
                "simulation_duration_hr": 12.0,
                "assumptions_metadata": [
                    "User-defined custom parameters.",
                    "All parameters carry explicit scenario provenance."
                ]
            }
        }

    def get_all_scenarios(self) -> Dict[str, Any]:
        """
        Returns all authoritative Tehri scenarios with full parameter schemas and assumptions metadata.
        """
        return {
            "total_scenarios": len(self.scenarios),
            "pmf_equals_dam_break": False,
            "rule_notice": "PMF is NOT automatically equated to a dam break.",
            "supported_categories": [
                "PMF_NO_FAILURE",
                "OVERTOPPING_FAILURE",
                "BREACH_FAILURE",
                "SPILLWAY_OPERATION",
                "EXTREME_INFLOW",
                "USER_DEFINED"
            ],
            "scenarios": self.scenarios
        }

    def get_scenario(self, scenario_id: str) -> Dict[str, Any]:
        """
        Retrieves scenario by ID or returns default TEHRI_PMF_NO_FAILURE.
        """
        return self.scenarios.get(scenario_id, self.scenarios["TEHRI_PMF_NO_FAILURE"])

    def evaluate_scenario_hydrodynamics(self, scenario_id: str) -> Dict[str, Any]:
        """
        Evaluates peak discharge and hydraulics for a specific scenario.
        Enforces: PMF routing without failure does NOT generate breach outflow!
        """
        scen = self.get_scenario(scenario_id)
        is_breach = scen["breach_occurrence"]
        inflow_q = scen["inflow_hydrograph"]["peak_discharge_m3s"]
        spillway_cap = scen["spillway_operation"]["discharge_capacity_m3s"]
        h0 = scen["reservoir_level_m"]

        if not is_breach:
            # No dam failure: Outflow is strictly controlled by reservoir routing and spillway operation
            peak_outflow_m3s = min(inflow_q, spillway_cap if spillway_cap > 0 else inflow_q)
            max_depth_m = round(min(65.0, 15.0 + (peak_outflow_m3s / 1000.0) * 1.8), 2)
            max_vel_ms = round(min(22.0, 3.5 + (peak_outflow_m3s / 1000.0) * 0.4), 2)
            breach_outflow_m3s = 0.0
        else:
            # Dam failure active: Outflow combines spillway release and breach hydrograph
            hb = scen["final_breach_width_m"]
            head_m = max(10.0, h0 - scen["breach_bottom_elevation_m"])
            # Froehlich Dam Breach Peak Formula
            breach_outflow_m3s = round(0.607 * math.pow(scen["initial_storage_mm3"] * 1e6, 0.295) * math.pow(head_m, 1.24), 1)
            peak_outflow_m3s = round(inflow_q + breach_outflow_m3s, 1)
            max_depth_m = round(min(70.0, 25.0 + (peak_outflow_m3s / 50000.0) * 15.0), 2)
            max_vel_ms = round(min(32.0, 8.0 + (peak_outflow_m3s / 50000.0) * 6.0), 2)

        return {
            "scenario_id": scen["scenario_id"],
            "scenario_name": scen["scenario_name"],
            "category": scen["category"],
            "breach_occurrence": is_breach,
            "reservoir_level_m": h0,
            "inflow_peak_m3s": inflow_q,
            "spillway_capacity_m3s": spillway_cap,
            "breach_peak_outflow_m3s": breach_outflow_m3s,
            "total_peak_outflow_m3s": peak_outflow_m3s,
            "max_depth_m": max_depth_m,
            "max_velocity_ms": max_vel_ms,
            "assumptions": scen["assumptions_metadata"]
        }
