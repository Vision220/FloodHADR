import math
from typing import Dict, Any, List, Optional

def get_tributary_network_data() -> List[Dict[str, Any]]:
    """
    Returns complete dataset of tributaries feeding into the Bhagirathi River System.
    """
    return [
        {
            "id": "trib-bhilangna",
            "name": "Bhilangna River",
            "tributary_type": "Major River Tributary",
            "catchment_area_km2": 380.0,
            "stream_order": 4,
            "confluence_node": "Old Tehri Confluence Node",
            "confluence_river_km": 42.5,
            "coordinates": {"lat": 30.38, "lng": 78.48},
            "normal_discharge_m3s": 120.0,
            "high_discharge_m3s": 450.0,
            "extreme_discharge_m3s": 1850.0,
            "flash_flood_discharge_m3s": 3200.0,
            "normal_velocity_ms": 1.8,
            "extreme_velocity_ms": 5.4,
            "arrival_time_min": 45.0, # Time to reach main confluence
            "slope_m_m": 0.015,
            "quality_status": "OBSERVED"
        },
        {
            "id": "trib-koti-nala",
            "name": "Koti Nala Stream",
            "tributary_type": "Mountain Slope Torrent",
            "catchment_area_km2": 240.0,
            "stream_order": 3,
            "confluence_node": "Tehri Reservoir Flank Junction",
            "confluence_river_km": 38.0,
            "coordinates": {"lat": 30.42, "lng": 78.48},
            "normal_discharge_m3s": 45.0,
            "high_discharge_m3s": 220.0,
            "extreme_discharge_m3s": 890.0,
            "flash_flood_discharge_m3s": 1950.0,
            "normal_velocity_ms": 2.2,
            "extreme_velocity_ms": 6.8,
            "arrival_time_min": 25.0,
            "slope_m_m": 0.028,
            "quality_status": "OBSERVED"
        },
        {
            "id": "trib-jadh-ganga",
            "name": "Jadh Ganga Tributary",
            "tributary_type": "Glacial High-Altitude Stream",
            "catchment_area_km2": 310.0,
            "stream_order": 3,
            "confluence_node": "Bhaironghati Junction",
            "confluence_river_km": 85.0,
            "coordinates": {"lat": 30.88, "lng": 78.72},
            "normal_discharge_m3s": 80.0,
            "high_discharge_m3s": 310.0,
            "extreme_discharge_m3s": 1250.0,
            "flash_flood_discharge_m3s": 2400.0,
            "normal_velocity_ms": 2.4,
            "extreme_velocity_ms": 6.2,
            "arrival_time_min": 60.0,
            "slope_m_m": 0.035,
            "quality_status": "OBSERVED"
        },
        {
            "id": "trib-bhagirathi-headwaters",
            "name": "Gangotri Glacier Mainstem",
            "tributary_type": "Main Headwaters",
            "catchment_area_km2": 420.0,
            "stream_order": 1,
            "confluence_node": "Dharali Junction",
            "confluence_river_km": 96.0,
            "coordinates": {"lat": 30.95, "lng": 78.85},
            "normal_discharge_m3s": 140.0,
            "high_discharge_m3s": 520.0,
            "extreme_discharge_m3s": 1900.0,
            "flash_flood_discharge_m3s": 2800.0,
            "normal_velocity_ms": 2.8,
            "extreme_velocity_ms": 7.1,
            "arrival_time_min": 90.0,
            "slope_m_m": 0.024,
            "quality_status": "OBSERVED"
        }
    ]


def calculate_tributary_hydraulics(
    tributary_id: str,
    flow_regime: str = "EXTREME", # NORMAL | HIGH | EXTREME | FLASH_FLOOD | COINCIDENT_PEAK
    rainfall_mm: float = 180.0,
    scs_cn: float = 78.0
) -> Dict[str, Any]:
    """
    Computes discharge, velocity, arrival time, and runoff volume for a tributary reach under given flow regime.
    """
    tribs = get_tributary_network_data()
    t_data = next((t for t in tribs if t["id"] == tributary_id), tribs[0])
    area_km2 = t_data["catchment_area_km2"]

    regime_upper = flow_regime.upper()
    if regime_upper == "NORMAL":
        base_q = t_data["normal_discharge_m3s"]
        velocity_ms = t_data["normal_velocity_ms"]
        arrival_min = t_data["arrival_time_min"] * 1.2
    elif regime_upper == "HIGH":
        base_q = t_data["high_discharge_m3s"]
        velocity_ms = (t_data["normal_velocity_ms"] + t_data["extreme_velocity_ms"]) / 2.0
        arrival_min = t_data["arrival_time_min"] * 0.9
    elif regime_upper in ["FLASH_FLOOD", "UNEXPECTED_FLASH_FLOOD"]:
        base_q = t_data["flash_flood_discharge_m3s"]
        velocity_ms = t_data["extreme_velocity_ms"] * 1.2
        arrival_min = t_data["arrival_time_min"] * 0.5 # Rapid arrival time
    elif regime_upper in ["COINCIDENT_PEAK", "COINCIDENT"]:
        base_q = t_data["extreme_discharge_m3s"] * 1.15
        velocity_ms = t_data["extreme_velocity_ms"] * 1.1
        arrival_min = t_data["arrival_time_min"] * 0.7
    else: # EXTREME
        base_q = t_data["extreme_discharge_m3s"]
        velocity_ms = t_data["extreme_velocity_ms"]
        arrival_min = t_data["arrival_time_min"] * 0.8

    # Calculate SCS-CN Runoff depth (Q = (P - Ia)^2 / (P - Ia + S))
    retention_s = (25400.0 / scs_cn) - 254.0
    ia_val = 0.20 * retention_s
    if rainfall_mm <= ia_val:
        runoff_depth_mm = 0.0
    else:
        runoff_depth_mm = ((rainfall_mm - ia_val) ** 2) / ((rainfall_mm - ia_val) + retention_s)

    runoff_volume_mm3 = round((runoff_depth_mm * area_km2 * 1000.0) / 1e6, 3)

    return {
        "tributary_id": t_data["id"],
        "name": t_data["name"],
        "catchment_area_km2": area_km2,
        "flow_regime": flow_regime,
        "rainfall_mm": rainfall_mm,
        "scs_cn": scs_cn,
        "runoff_depth_mm": round(runoff_depth_mm, 2),
        "runoff_volume_mm3": runoff_volume_mm3,
        "peak_discharge_m3s": round(base_q, 1),
        "velocity_ms": round(velocity_ms, 2),
        "arrival_time_min": round(arrival_min, 1),
        "confluence_node": t_data["confluence_node"],
        "confluence_river_km": t_data["confluence_river_km"],
        "coordinates": t_data["coordinates"]
    }
