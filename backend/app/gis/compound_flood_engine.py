import math
from typing import Dict, Any, List, Optional
from app.gis.tributary_analyzer import (
    get_tributary_network_data,
    calculate_tributary_hydraulics
)

def get_compound_scenario_presets() -> List[Dict[str, Any]]:
    """
    Returns 5 standardized compound scenario ranges:
    - Minimum (Normal baseline)
    - Normal (Standard monsoon coincident flow)
    - High (Heavy rainfall + elevated tributary)
    - Maximum (Cloudburst + Flash Flood + Max Reservoir)
    - Extreme Stress Scenario (PMF Cloudburst + Dam Breach + Coincident Multi-Tributary Flash Flood)
    """
    return [
        {
            "id": "scen-minimum",
            "name": "Minimum",
            "code": "MIN_BASELINE",
            "description font": "Normal baseline river flow & low tributary inflow",
            "dam_breach": False,
            "main_river_flow_m3s": 350.0,
            "reservoir_water_level_m": 740.0,
            "tributary_regime": "NORMAL",
            "rainfall_mm": 25.0,
            "classification_label": "SCENARIO-BASED EXTREME CASE",
            "risk_color": "#38bdf8"
        },
        {
            "id": "scen-normal",
            "name": "Normal",
            "code": "MONSOON_COINCIDENT",
            "description": "Standard monsoon coincident flow & full reservoir pool",
            "dam_breach": False,
            "main_river_flow_m3s": 1250.0,
            "reservoir_water_level_m": 830.0,
            "tributary_regime": "HIGH",
            "rainfall_mm": 85.0,
            "classification_label": "SCENARIO-BASED EXTREME CASE",
            "risk_color": "#3b82f6"
        },
        {
            "id": "scen-high",
            "name": "High",
            "code": "HEAVY_SURGE",
            "description": "Heavy rainfall surge + elevated tributary runoff",
            "dam_breach": False,
            "main_river_flow_m3s": 3800.0,
            "reservoir_water_level_m": 832.5,
            "tributary_regime": "HIGH",
            "rainfall_mm": 140.0,
            "classification_label": "SCENARIO-BASED EXTREME CASE",
            "risk_color": "#eab308"
        },
        {
            "id": "scen-maximum",
            "name": "Maximum",
            "code": "CLOUDBURST_FLASH",
            "description": "Cloudburst + Tributary Flash Flood + MWL Spillway Discharge",
            "dam_breach": False,
            "main_river_flow_m3s": 12500.0,
            "reservoir_water_level_m": 835.0,
            "tributary_regime": "FLASH_FLOOD",
            "rainfall_mm": 220.0,
            "classification_label": "SCENARIO-BASED EXTREME CASE",
            "risk_color": "#f97316"
        },
        {
            "id": "scen-extreme-stress",
            "name": "Extreme Stress Scenario",
            "code": "PMF_BREACH_COMPOUND",
            "description": "PMF Cloudburst + Dam Breach + Coincident Multi-Tributary Flash Flood Superposition",
            "dam_breach": True,
            "main_river_flow_m3s": 15540.0,
            "reservoir_water_level_m": 839.5,
            "tributary_regime": "COINCIDENT_PEAK",
            "rainfall_mm": 350.0,
            "classification_label": "SCENARIO-BASED EXTREME CASE",
            "risk_color": "#ef4444"
        }
    ]


def simulate_compound_flood_scenario(
    scenario_preset_id: str = "scen-extreme-stress",
    include_dam_breach: Optional[bool] = None,
    custom_rainfall_mm: Optional[float] = None,
    tributary_regime: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes multi-hazard compound flood superposition:
    Extreme Rainfall + Tributary Flash Flood + High Main-River Flow + High Reservoir Level + Dam-Break Scenario
    """
    presets = get_compound_scenario_presets()
    preset = next((p for p in presets if p["id"] == scenario_preset_id), presets[4])

    dam_breach_active = include_dam_breach if include_dam_breach is not None else preset["dam_breach"]
    rainfall_mm = custom_rainfall_mm if custom_rainfall_mm is not None else preset["rainfall_mm"]
    regime = tributary_regime if tributary_regime is not None else preset["tributary_regime"]

    # 1. Main River Baseline Flow (m3/s)
    q_main = preset["main_river_flow_m3s"]

    # 2. Reservoir Spillway Outflow (m3/s)
    z_water = preset["reservoir_water_level_m"]
    z_spillway = 815.0
    if z_water > z_spillway:
        h_spill = z_water - z_spillway
        # Spillway discharge formula Q = C * L * H^1.5
        q_spillway = round(min(15540.0, 3.2 * 150.0 * (h_spill ** 1.5)), 1)
    else:
        q_spillway = 0.0

    # 3. Dam Breach Peak Discharge (m3/s)
    if dam_breach_active:
        h_head = max(10.0, z_water - 579.0) # foundation 579m
        v_storage_m3 = 3540.0 * 1e6
        q_breach = round(0.607 * (v_storage_m3 ** 0.295) * (h_head ** 1.24), 1) # ~64,200 m3/s
    else:
        q_breach = 0.0

    # 4. Tributaries Hydraulics & Confluence Junction Contributions
    trib_network = get_tributary_network_data()
    tributary_results = []
    total_trib_discharge = 0.0

    for trib in trib_network:
        t_hydr = calculate_tributary_hydraulics(
            tributary_id=trib["id"],
            flow_regime=regime,
            rainfall_mm=rainfall_mm,
            scs_cn=78.0
        )
        total_trib_discharge += t_hydr["peak_discharge_m3s"]
        tributary_results.append(t_hydr)

    # 5. Combined Downstream Superposition Hydraulics
    q_combined = round(q_main + q_spillway + q_breach + total_trib_discharge, 1)

    # Calculate downstream water depth h = 0.4 * Q^0.38
    stage_depth_m = round(0.4 * (q_combined ** 0.38), 2)
    velocity_ms = round(min(12.0, 0.5 * (q_combined ** 0.25)), 2)

    # Calculate Tributary Contribution Percentages & Confluence Backwater Effects
    confluence_junctions = []
    for t_hydr in tributary_results:
        contrib_percent = round((t_hydr["peak_discharge_m3s"] / max(1.0, q_combined)) * 100.0, 1)
        # Backwater head increase delta_h ~ 0.005 * Q_trib^0.5
        backwater_inc_m = round(0.005 * (t_hydr["peak_discharge_m3s"] ** 0.5), 2)
        confluence_junctions.append({
            "junction_name": t_hydr["confluence_node"],
            "tributary_name": t_hydr["name"],
            "tributary_discharge_m3s": t_hydr["peak_discharge_m3s"],
            "contribution_percentage": contrib_percent,
            "arrival_time_min": t_hydr["arrival_time_min"],
            "backwater_stage_increase_m": backwater_inc_m,
            "coordinates": t_hydr["coordinates"]
        })

    return {
        "status": "SUCCESS",
        "scenario_preset": preset,
        "hazard_components": {
            "main_river_flow_m3s": q_main,
            "reservoir_spillway_release_m3s": q_spillway,
            "dam_breach_outflow_m3s": q_breach,
            "total_tributaries_discharge_m3s": round(total_trib_discharge, 1),
            "dam_breach_active": dam_breach_active
        },
        "combined_downstream_hydraulics": {
            "combined_peak_discharge_m3s": q_combined,
            "combined_water_depth_m": stage_depth_m,
            "combined_velocity_ms": velocity_ms,
            "downstream_peak_arrival_time_hr": round(min(t["arrival_time_min"] for t in tributary_results) / 60.0, 2)
        },
        "confluence_junctions": confluence_junctions,
        "tributaries_detail": tributary_results,
        "statistical_classification": {
            "label": "SCENARIO-BASED EXTREME CASE",
            "probability_statement": "UNAVAILABLE / UNCALIBRATED",
            "statistical_notice": "Do NOT fabricate probabilities. If statistical data is unavailable, label the result: SCENARIO-BASED EXTREME CASE, not 'probability = X%'."
        }
    }
