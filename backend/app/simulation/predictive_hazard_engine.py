import math
from typing import Dict, Any, List, Optional

from app.rainfall.scs_cn_model import calculate_scs_cn_runoff
from app.gis.tributary_analyzer import calculate_tributary_hydraulics, get_tributary_network_data
from app.climate.climate_analyzer import analyze_climate_risk_scenario
from app.gis.landslide_blockage_engine import simulate_landslide_river_blockage
from app.sensors.telemetry_engine import TelemetryEngine
from app.simulation.hydrodynamic_engine import HydrodynamicEngine

class PredictiveHazardEngine:
    """
    Master Integrated Predictive Hazard & Ensemble Scenario Engine.
    Integrates:
    Rainfall + SCS-CN + River Branches + Tributaries + Reservoir + Dam Breach + Climate Projections + Landslide Blockage + Real-Time Telemetry + Hydrodynamic Engine.
    """

    def __init__(self):
        self.engine_name = "FloodHADR Master Predictive Hazard Engine"
        self.version = "3.0-ENSEMBLE-AI"
        self.hydro_engine = HydrodynamicEngine()
        self.telemetry_engine = TelemetryEngine()

    def get_ensemble_scenarios_definition(self) -> List[Dict[str, Any]]:
        """Returns definitions of Scenarios A through F and Envelope Mappings."""
        return [
            {
                "id": "SCEN_A",
                "code": "Scenario A",
                "envelope": "Plausible Minimum",
                "name": "Normal Rainfall + Normal Reservoir",
                "description": "Ambient dry/normal rainfall (50mm), normal reservoir pool (740m), clear river channel.",
                "rainfall_mm": 50.0, "scs_cn": 68.0, "reservoir_level_m": 740.0, "dam_breach": False,
                "tributary_regime": "NORMAL", "landslide_blockage": "NONE", "climate_scaling": 1.0,
                "risk_color": "#38bdf8"
            },
            {
                "id": "SCEN_B",
                "code": "Scenario B",
                "envelope": "Typical",
                "name": "Heavy Rainfall + High Reservoir",
                "description": "Monsoon heavy rainfall (120mm), high reservoir level (825m), elevated tributary inflows.",
                "rainfall_mm": 120.0, "scs_cn": 75.0, "reservoir_level_m": 825.0, "dam_breach": False,
                "tributary_regime": "HIGH", "landslide_blockage": "NONE", "climate_scaling": 1.0,
                "risk_color": "#3b82f6"
            },
            {
                "id": "SCEN_C",
                "code": "Scenario C",
                "envelope": "High",
                "name": "Extreme Rainfall + Tributary Flash Flood",
                "description": "Cloudburst precipitation (220mm) + coincident tributary flash flood surge.",
                "rainfall_mm": 220.0, "scs_cn": 80.0, "reservoir_level_m": 830.0, "dam_breach": False,
                "tributary_regime": "FLASH_FLOOD", "landslide_blockage": "NONE", "climate_scaling": 1.0,
                "risk_color": "#eab308"
            },
            {
                "id": "SCEN_D",
                "code": "Scenario D",
                "envelope": "Plausible Maximum",
                "name": "Extreme Rainfall + High Reservoir + Dam Breach",
                "description": "Cloudburst rainfall (300mm) + full reservoir (835m) + catastrophic dam breach (140m width).",
                "rainfall_mm": 300.0, "scs_cn": 83.0, "reservoir_level_m": 835.0, "dam_breach": True,
                "tributary_regime": "FLASH_FLOOD", "landslide_blockage": "NONE", "climate_scaling": 1.0,
                "risk_color": "#f97316"
            },
            {
                "id": "SCEN_E",
                "code": "Scenario E",
                "envelope": "Extreme Stress Scenario",
                "name": "Extreme Rainfall + Landslide Blockage + Dam Scenario",
                "description": "PMF Cloudburst (350mm) + Koti Nala Major Landslide Dam Failure + Main Dam Breach.",
                "rainfall_mm": 350.0, "scs_cn": 85.0, "reservoir_level_m": 838.0, "dam_breach": True,
                "tributary_regime": "COINCIDENT_PEAK", "landslide_blockage": "MAJOR_BLOCKAGE", "climate_scaling": 1.0,
                "risk_color": "#ef4444"
            },
            {
                "id": "SCEN_F",
                "code": "Scenario F",
                "envelope": "Extreme Stress Scenario",
                "name": "Climate-Adjusted Rainfall + Compound Flooding",
                "description": "2050 SSP3-7.0 Climate (+28% rainfall surge) + Multi-Tributary Flash Surge + Breach Wave.",
                "rainfall_mm": 350.0 * 1.28, "scs_cn": 88.0, "reservoir_level_m": 839.5, "dam_breach": True,
                "tributary_regime": "COINCIDENT_PEAK", "landslide_blockage": "MAJOR_BLOCKAGE", "climate_scaling": 1.28,
                "risk_color": "#991b1b"
            }
        ]

    def _get_affected_assets(self, max_depth_m: float, max_velocity_ms: float) -> List[Dict[str, Any]]:
        """Determines impacted critical infrastructure assets based on hydraulic thresholds."""
        assets = [
            {"id": "ast-01", "name": "Tehri Power House Complex", "type": "POWER_INFRA", "criticality": "HIGH", "threshold_depth_m": 2.0},
            {"id": "ast-02", "name": "Koti Colony Substation & Housing", "type": "CIVIL_SETTLEMENT", "criticality": "MEDIUM", "threshold_depth_m": 1.0},
            {"id": "ast-03", "name": "Uttarkashi Hydro Gauge Station", "type": "HYDRO_TELEMETRY", "criticality": "CRITICAL", "threshold_depth_m": 1.5},
            {"id": "ast-04", "name": "Malitha Bridge & Highway NH-34", "type": "TRANSPORT_BRIDGE", "criticality": "HIGH", "threshold_depth_m": 3.0},
            {"id": "ast-05", "name": "Devprayag Confluence Ghats", "type": "CULTURAL_HERITAGE", "criticality": "HIGH", "threshold_depth_m": 2.5},
            {"id": "ast-06", "name": "Rishikesh AIIMS Evacuation Shelter", "type": "MEDICAL_SHELTER", "criticality": "CRITICAL", "threshold_depth_m": 5.0}
        ]

        impacted = []
        for a in assets:
            if max_depth_m >= a["threshold_depth_m"]:
                status = "CRITICAL_INUNDATION" if max_depth_m >= a["threshold_depth_m"] * 2.0 else "IMPACTED"
                impacted.append({
                    "asset_id": a["id"],
                    "asset_name": a["name"],
                    "asset_type": a["type"],
                    "criticality": a["criticality"],
                    "status": status,
                    "inundation_depth_m": round(max_depth_m, 2),
                    "velocity_ms": round(max_velocity_ms, 2)
                })
        return impacted

    def evaluate_scenario(self, scenario_id: str = "SCEN_E") -> Dict[str, Any]:
        """Calculates full predictive hydraulic pipeline and uncertainty bounds for a scenario."""
        defs = self.get_ensemble_scenarios_definition()
        scen = next((s for s in defs if s["id"] == scenario_id), defs[4])

        # 1. SCS-CN Runoff
        scs = calculate_scs_cn_runoff(rainfall_p_mm=scen["rainfall_mm"], cn_value=scen["scs_cn"])
        runoff_mm = scs["runoff_depth_q_mm"]

        # 2. Tributaries
        total_trib_q = sum(
            calculate_tributary_hydraulics(t["id"], flow_regime=scen["tributary_regime"], rainfall_mm=scen["rainfall_mm"])["peak_discharge_m3s"]
            for t in get_tributary_network_data()
        )

        # 3. Landslide Blockage Surge Component
        if scen["landslide_blockage"] != "NONE":
            ls_res = simulate_landslide_river_blockage(blockage_scenario=scen["landslide_blockage"], trigger_rainfall_mm=scen["rainfall_mm"])
            ls_surge_q = ls_res["breach_hydrograph"]["peak_breach_outflow_m3s"]
        else:
            ls_surge_q = 0.0

        # 4. Hydrodynamic Simulation
        sim_res = self.hydro_engine.run_simulation(
            scenario_envelope="EXTREME" if scen["dam_breach"] else "HIGH",
            custom_rainfall_mm=scen["rainfall_mm"],
            custom_scs_cn=scen["scs_cn"],
            custom_reservoir_level_m=scen["reservoir_level_m"],
            include_dam_breach=scen["dam_breach"]
        )

        outputs = sim_res["hydrodynamic_outputs"]
        q_peak = round(outputs["combined_peak_discharge_m3s"] + ls_surge_q, 1)
        depth_max = round(outputs["max_water_depth_m"] * (1.0 + 0.05 * (ls_surge_q / max(1.0, q_peak))), 2)
        vel_max = round(outputs["max_velocity_ms"], 2)
        area_km2 = round(outputs["flood_inundation_area_km2"] * (1.0 + 0.03 * (ls_surge_q / max(1.0, q_peak))), 2)
        arr_min = round(outputs["peak_arrival_time_min"], 1)
        dur_hr = round(outputs["flood_duration_hr"], 1)

        # 5. Uncertainty Ranges (bounds based on ±15% to ±25% hydraulic parameter variance)
        q_lower = round(q_peak * 0.82, 1)
        q_upper = round(q_peak * 1.22, 1)
        depth_lower = round(depth_max * 0.85, 2)
        depth_upper = round(depth_max * 1.25, 2)
        vel_lower = round(vel_max * 0.88, 2)
        vel_upper = round(vel_max * 1.18, 2)
        area_lower = round(area_km2 * 0.85, 2)
        area_upper = round(area_km2 * 1.22, 2)

        affected_assets = self._get_affected_assets(depth_max, vel_max)

        return {
            "scenario": scen,
            "calculated_hydraulics": {
                "peak_discharge_m3s": q_peak,
                "max_water_depth_m": depth_max,
                "max_velocity_ms": vel_max,
                "flood_inundation_area_km2": area_km2,
                "peak_arrival_time_min": arr_min,
                "flood_duration_hr": dur_hr,
                "runoff_depth_mm": runoff_mm,
                "tributary_surge_m3s": round(total_trib_q, 1),
                "landslide_surge_m3s": round(ls_surge_q, 1)
            },
            "uncertainty_ranges": {
                "peak_discharge_range_m3s": f"{q_lower:,.1f} – {q_upper:,.1f} m³/s",
                "max_water_depth_range_m": f"{depth_lower} – {depth_upper} m",
                "max_velocity_range_ms": f"{vel_lower} – {vel_upper} m/s",
                "flood_inundation_area_range_km2": f"{area_lower} – {area_upper} km²"
            },
            "affected_assets_count": len(affected_assets),
            "affected_assets": affected_assets,
            "statistical_rigor_notice": "Scenario envelope — probability not statistically calibrated."
        }

    def generate_full_predictive_ensemble(self) -> Dict[str, Any]:
        """Runs all Scenarios A through F and generates complete predictive ensemble matrix."""
        defs = self.get_ensemble_scenarios_definition()
        ensemble_results = []

        for d in defs:
            res = self.evaluate_scenario(d["id"])
            ensemble_results.append(res)

        return {
            "status": "SUCCESS",
            "engine_metadata": {
                "engine_name": self.engine_name,
                "version": self.version,
                "scenario_count": len(defs)
            },
            "ensemble_matrix": ensemble_results,
            "statistical_rigor_notice": "Scenario envelope — probability not statistically calibrated."
        }
