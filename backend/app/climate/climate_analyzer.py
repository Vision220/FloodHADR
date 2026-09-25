import math
from typing import Dict, Any, List, Optional
from app.climate.climate_provider import (
    ClimateProjectionProvider,
    DemoClimateProjectionProvider,
    CMIPClimateProjectionProvider,
    CORDEXClimateProjectionProvider
)
from app.rainfall.scs_cn_model import calculate_scs_cn_runoff

def get_available_climate_providers() -> List[Dict[str, Any]]:
    """Returns list of registered climate projection providers."""
    providers = [
        DemoClimateProjectionProvider(),
        CMIPClimateProjectionProvider(),
        CORDEXClimateProjectionProvider()
    ]
    return [p.get_provider_metadata() for p in providers]


def analyze_climate_risk_scenario(
    horizon_year: str = "2050",
    ssp_scenario: str = "SSP3-7.0",
    provider_id: str = "demo-sensitivity-climate",
    baseline_rainfall_mm: float = 180.0,
    scs_cn: float = 78.0,
    custom_rainfall_mult: Optional[float] = None,
    custom_runoff_mult: Optional[float] = None,
    custom_inflow_mult: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes side-by-side comparison between Current Climate (Baseline) and Future Climate Scenario.
    Evaluates:
    - Rainfall (mm & % change)
    - Runoff (depth mm, volume Mm3 & % change)
    - Peak Discharge (m3/s & % change)
    - Flood Inundation Area (km2 & % change)
    - Maximum Water Depth (m & % change)
    - Maximum Flow Velocity (m/s & % change)
    """

    # Select provider
    if provider_id == "cmip6-wcrp":
        provider = CMIPClimateProjectionProvider()
    elif provider_id == "cordex-south-asia":
        provider = CORDEXClimateProjectionProvider()
    else:
        provider = DemoClimateProjectionProvider()

    metadata = provider.get_provider_metadata()
    factors = provider.get_projection_factors(horizon_year=horizon_year, ssp_scenario=ssp_scenario)

    # Custom override sensitivity sliders if provided
    rain_mult = custom_rainfall_mult if custom_rainfall_mult is not None else factors["rainfall_intensity_multiplier"]
    runoff_mult = custom_runoff_mult if custom_runoff_mult is not None else factors["runoff_response_factor"]
    inflow_mult = custom_inflow_mult if custom_inflow_mult is not None else factors["reservoir_inflow_multiplier"]
    glacier_surge = factors.get("glacier_melt_surge_m3s", 0.0)

    # 1. BASELINE (CURRENT CLIMATE) CALCULATIONS
    scs_baseline = calculate_scs_cn_runoff(rainfall_p_mm=baseline_rainfall_mm, cn_value=scs_cn)
    base_rainfall_mm = baseline_rainfall_mm
    base_runoff_depth_mm = scs_baseline["runoff_depth_q_mm"]
    base_runoff_vol_mm3 = scs_baseline["runoff_volume_mm3"]
    
    base_q_peak = 12500.0 # Baseline design storm peak flow m3/s
    base_flood_area_km2 = round(18.5 + 0.002 * base_q_peak, 2) # ~43.5 km2
    base_max_depth_m = round(0.4 * (base_q_peak ** 0.38), 2)   # ~14.2 m
    base_max_velocity_ms = round(min(12.0, 0.5 * (base_q_peak ** 0.25)), 2) # ~5.29 m/s

    # 2. FUTURE CLIMATE SCENARIO CALCULATIONS
    fut_rainfall_mm = round(baseline_rainfall_mm * rain_mult, 1)
    scs_future = calculate_scs_cn_runoff(rainfall_p_mm=fut_rainfall_mm, cn_value=scs_cn)
    fut_runoff_depth_mm = round(scs_future["runoff_depth_q_mm"] * runoff_mult, 1)
    fut_runoff_vol_mm3 = round(scs_future["runoff_volume_mm3"] * runoff_mult, 2)

    # Peak discharge with inflow surge & glacier melt component
    fut_q_peak = round((base_q_peak * inflow_mult) + glacier_surge, 1)
    fut_flood_area_km2 = round(18.5 + 0.002 * fut_q_peak, 2)
    fut_max_depth_m = round(0.4 * (fut_q_peak ** 0.38), 2)
    fut_max_velocity_ms = round(min(12.0, 0.5 * (fut_q_peak ** 0.25)), 2)

    # Helper for percent change calculation
    def pct_change(base_val: float, fut_val: float) -> float:
        if base_val == 0.0:
            return 0.0
        return round(((fut_val - base_val) / base_val) * 100.0, 1)

    return {
        "status": "SUCCESS",
        "provider_metadata": metadata,
        "scenario_horizon": {
            "horizon_year": horizon_year,
            "ssp_scenario": ssp_scenario,
            "temperature_anomaly_c": factors.get("temp_anomaly_c", 0.0)
        },
        "sensitivity_factors": {
            "rainfall_intensity_multiplier": rain_mult,
            "extreme_precipitation_multiplier": factors.get("extreme_precipitation_multiplier", rain_mult),
            "runoff_response_factor": runoff_mult,
            "reservoir_inflow_multiplier": inflow_mult,
            "glacier_melt_surge_m3s": glacier_surge
        },
        "current_climate": {
            "rainfall_mm": base_rainfall_mm,
            "runoff_depth_mm": base_runoff_depth_mm,
            "runoff_volume_million_m3": base_runoff_vol_mm3,
            "peak_discharge_m3s": base_q_peak,
            "flood_area_km2": base_flood_area_km2,
            "max_water_depth_m": base_max_depth_m,
            "max_velocity_ms": base_max_velocity_ms
        },
        "future_climate": {
            "rainfall_mm": fut_rainfall_mm,
            "runoff_depth_mm": fut_runoff_depth_mm,
            "runoff_volume_million_m3": fut_runoff_vol_mm3,
            "peak_discharge_m3s": fut_q_peak,
            "flood_area_km2": fut_flood_area_km2,
            "max_water_depth_m": fut_max_depth_m,
            "max_velocity_ms": fut_max_velocity_ms
        },
        "delta_comparison": {
            "rainfall_pct_change": pct_change(base_rainfall_mm, fut_rainfall_mm),
            "runoff_depth_pct_change": pct_change(base_runoff_depth_mm, fut_runoff_depth_mm),
            "runoff_volume_pct_change": pct_change(base_runoff_vol_mm3, fut_runoff_vol_mm3),
            "peak_discharge_pct_change": pct_change(base_q_peak, fut_q_peak),
            "flood_area_pct_change": pct_change(base_flood_area_km2, fut_flood_area_km2),
            "max_depth_pct_change": pct_change(base_max_depth_m, fut_max_depth_m),
            "max_velocity_pct_change": pct_change(base_max_velocity_ms, fut_max_velocity_ms)
        },
        "data_rigor_notice": metadata["notice"]
    }
