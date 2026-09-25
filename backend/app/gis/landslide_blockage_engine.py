import math
from typing import Dict, Any, List, Optional
from app.gis.landslide_analyzer import (
    get_known_landslide_inventory,
    calculate_landslide_susceptibility
)

def simulate_landslide_river_blockage(
    blockage_scenario: str = "MAJOR_BLOCKAGE", # NONE | PARTIAL_BLOCKAGE | MAJOR_BLOCKAGE
    landslide_id: str = "ls-koti-nala",
    river_inflow_m3s: float = 1250.0,
    trigger_rainfall_mm: float = 180.0,
    custom_slide_volume_m3: Optional[float] = None
) -> Dict[str, Any]:
    """
    Cascading Hydrodynamic Simulation:
    Landslide -> River Blockage -> Upstream Water Level Increase (Ponding) -> Temporary Storage -> Blockage Failure -> Sudden Downstream Flood Wave
    """
    inventory = get_known_landslide_inventory()
    slide = next((s for s in inventory if s["id"] == landslide_id), inventory[0])

    vol_m3 = custom_slide_volume_m3 if custom_slide_volume_m3 is not None else slide["estimated_volume_m3"]
    scenario_upper = blockage_scenario.upper()

    # 1. Blockage Percentage & Landslide Dam Geometry
    if scenario_upper == "NONE":
        blockage_pct = 0.0
        dam_height_m = 0.0
        ponding_vol_mm3 = 0.0
        water_level_inc_m = 0.0
        ponded_area_km2 = 0.0
        time_to_overtop_hr = 0.0
        q_breach_peak = 0.0
        failure_time_min = 0.0
        surge_depth_m = 0.0
        wave_velocity_ms = round(min(12.0, 0.5 * (river_inflow_m3s ** 0.25)), 2)
        q_combined_downstream = river_inflow_m3s
    elif scenario_upper == "PARTIAL_BLOCKAGE":
        blockage_pct = 40.0 # 40% channel constriction
        dam_height_m = round(min(35.0, 5.0 + 0.00001 * vol_m3), 1) # ~20m
        water_level_inc_m = round(dam_height_m * 0.55, 1) # ~11m rise
        ponding_vol_mm3 = round(0.008 * (water_level_inc_m ** 2.1), 2) # ~12.5 Mm3
        ponded_area_km2 = round(0.45 * water_level_inc_m, 2)
        
        # Time to fill temporary pond storage (hours) = Volume / Inflow
        vol_m3_pond = ponding_vol_mm3 * 1e6
        time_to_overtop_hr = round(vol_m3_pond / (max(1.0, river_inflow_m3s) * 3600.0), 2)

        # Failure hydrograph peak (Costa & Schuster empirical dam breach peak formula Q_p = 0.04 * V_storage^0.42 * H_dam^0.93)
        q_breach_peak = round(0.04 * ((vol_m3_pond) ** 0.42) * (dam_height_m ** 0.93), 1) # ~3,800 m3/s
        failure_time_min = round(45.0 + 15.0 * (1.0 / max(0.1, river_inflow_m3s / 1000.0)), 1)
        q_combined_downstream = round(river_inflow_m3s + q_breach_peak, 1)
        surge_depth_m = round(0.4 * (q_combined_downstream ** 0.38), 2)
        wave_velocity_ms = round(min(12.0, 0.5 * (q_combined_downstream ** 0.25)), 2)
    else: # MAJOR_BLOCKAGE
        blockage_pct = 85.0 # 85% channel constriction / full landslide damming
        dam_height_m = round(min(75.0, 15.0 + 0.000025 * vol_m3), 1) # ~52.5m
        water_level_inc_m = round(dam_height_m * 0.82, 1) # ~43m rise
        ponding_vol_mm3 = round(0.025 * (water_level_inc_m ** 2.2), 2) # ~98.5 Mm3
        ponded_area_km2 = round(0.95 * water_level_inc_m, 2)

        vol_m3_pond = ponding_vol_mm3 * 1e6
        time_to_overtop_hr = round(vol_m3_pond / (max(1.0, river_inflow_m3s) * 3600.0), 2)

        # Catastrophic landslide dam breach outflow
        q_breach_peak = round(0.04 * ((vol_m3_pond) ** 0.42) * (dam_height_m ** 0.93), 1) # ~14,500 m3/s
        failure_time_min = round(25.0 + 10.0 * (1.0 / max(0.1, river_inflow_m3s / 1000.0)), 1)
        q_combined_downstream = round(river_inflow_m3s + q_breach_peak, 1)
        surge_depth_m = round(0.4 * (q_combined_downstream ** 0.38), 2)
        wave_velocity_ms = round(min(12.0, 0.5 * (q_combined_downstream ** 0.25)), 2)

    # Calculate susceptibility index for the site
    susceptibility = calculate_landslide_susceptibility(
        slope_deg=slide["slope_deg"],
        elevation_m=slide["elevation_m"],
        trigger_rainfall_mm=trigger_rainfall_mm
    )

    return {
        "status": "SUCCESS",
        "scenario": blockage_scenario,
        "landslide_site": slide,
        "blockage_geometry": {
            "blockage_percentage": blockage_pct,
            "landslide_volume_m3": vol_m3,
            "landslide_dam_height_m": dam_height_m,
            "river_km": slide["river_km"],
            "coordinates": slide["coordinates"]
        },
        "upstream_ponding": {
            "water_level_increase_m": water_level_inc_m,
            "ponding_volume_million_m3": ponding_vol_mm3,
            "ponded_surface_area_km2": ponded_area_km2,
            "time_to_overtop_hr": time_to_overtop_hr
        },
        "breach_hydrograph": {
            "peak_breach_outflow_m3s": q_breach_peak,
            "breach_failure_time_min": failure_time_min,
            "total_downstream_peak_q_m3s": q_combined_downstream,
            "downstream_surge_depth_m": surge_depth_m,
            "downstream_wave_velocity_ms": wave_velocity_ms
        },
        "susceptibility_analysis": susceptibility,
        "geotechnical_notice": "SIMPLIFIED GEOTECHNICAL SCENARIO — NOT GEOLOGICAL PREDICTION"
    }
