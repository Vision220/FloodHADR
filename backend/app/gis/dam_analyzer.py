import math
from typing import Dict, Any, List, Optional

# Constants for fluid mechanics
RHO_WATER = 1000.0  # kg/m3 (density of water)
G_ACCEL = 9.81      # m/s2 (gravitational acceleration)

def compute_hydrostatic_parameters(
    water_level_m: float,
    foundation_elevation_m: float = 579.0,
    crest_elevation_m: float = 839.5,
    spillway_level_m: float = 815.0,
    crest_length_m: float = 575.0,
    storage_capacity_mm3: float = 3540.0,
    normal_level_m: float = 830.0
) -> Dict[str, Any]:
    """
    Computes hydrostatic parameters for a dam & reservoir system:
    - hydraulic_head (h = water_level - foundation_elevation)
    - hydrostatic_pressure (P = rho * g * h)
    - hydrostatic_force_per_m (F_unit = 0.5 * rho * g * h^2)
    - total_hydrostatic_force (F_total = F_unit * crest_length)
    - reservoir_head (head over spillway: h_spillway = max(0, water_level - spillway_level))
    - storage_volume (estimated using hypsometric depth-storage curve)
    """
    # 1. Hydraulic Head (depth of water above foundation)
    hydraulic_head_m = max(0.0, water_level_m - foundation_elevation_m)
    
    # 2. Maximum Hydrostatic Pressure at Toe/Base (P = rho * g * h) in Pascals & MegaPascals
    pressure_pascal = RHO_WATER * G_ACCEL * hydraulic_head_m
    pressure_kpa = round(pressure_pascal / 1000.0, 2)
    pressure_mpa = round(pressure_pascal / 1e6, 3)

    # 3. Estimated Hydrostatic Force / Thrust (F = 0.5 * rho * g * h^2) per meter width
    force_per_m_n = 0.5 * RHO_WATER * G_ACCEL * (hydraulic_head_m ** 2)
    force_per_m_kn = round(force_per_m_n / 1000.0, 2)
    
    # Total Hydrostatic Force acting on the dam face (MN)
    total_force_mn = round((force_per_m_n * crest_length_m) / 1e6, 2)

    # 4. Reservoir Head & Spillway Overtopping Head
    spillway_head_m = round(max(0.0, water_level_m - spillway_level_m), 2)
    freeboard_m = round(max(0.0, crest_elevation_m - water_level_m), 2)

    # 5. Triangular Pressure Distribution Curve (Crest to Foundation)
    # Generate 10 vertical depth steps
    depth_steps = 10
    pressure_profile = []
    for i in range(depth_steps + 1):
        step_depth = (hydraulic_head_m / depth_steps) * i
        step_elevation = round(foundation_elevation_m + (hydraulic_head_m - step_depth), 1)
        step_pressure_kpa = round((RHO_WATER * G_ACCEL * step_depth) / 1000.0, 2)
        pressure_profile.append({
            "depth_m": round(step_depth, 1),
            "elevation_m": step_elevation,
            "pressure_kpa": step_pressure_kpa
        })

    # 6. Storage Relationship (Hypsometric Depth-Storage Curve)
    # Storage V(z) ~ V_max * ((z - z_min)/(z_frl - z_min))^2.2
    total_height = max(1.0, normal_level_m - foundation_elevation_m)
    rel_depth = max(0.0, min(1.3, (water_level_m - foundation_elevation_m) / total_height))
    calculated_storage_mm3 = round(storage_capacity_mm3 * (rel_depth ** 2.2), 1)

    return {
        "hydraulic_head_m": round(hydraulic_head_m, 2),
        "hydrostatic_pressure_kpa": pressure_kpa,
        "hydrostatic_pressure_mpa": pressure_mpa,
        "force_per_meter_kn_m": force_per_m_kn,
        "total_hydrostatic_force_mn": total_force_mn,
        "spillway_head_m": spillway_head_m,
        "freeboard_m": freeboard_m,
        "calculated_storage_mm3": calculated_storage_mm3,
        "pressure_distribution_profile": pressure_profile,
        "disclaimer_notice": "Simplified hydrostatic calculations for hydrological simulation context only — not a structural safety evaluation or geotechnical dam stability audit."
    }


def get_reservoir_condition_presets() -> List[Dict[str, Any]]:
    """
    Returns 5 standardized reservoir condition presets:
    - Minimum (MOL)
    - Normal (FRL)
    - High (Monsoon Storage Pool)
    - Maximum (MWL)
    - Extreme Scenario (PMF Cloudburst Crest Level)
    """
    return [
        {
            "id": "cond-minimum",
            "name": "Minimum",
            "code": "MOL",
            "description": "Minimum Operating Level (Dead Storage Level)",
            "water_level_m": 740.0,
            "storage_mm3": 925.0,
            "reservoir_percentage": 26.1,
            "breach_risk_tier": "LOW",
            "color": "#38bdf8"
        },
        {
            "id": "cond-normal",
            "name": "Normal",
            "code": "FRL",
            "description": "Full Reservoir Level (Normal Design Pool)",
            "water_level_m": 830.0,
            "storage_mm3": 3540.0,
            "reservoir_percentage": 100.0,
            "breach_risk_tier": "MODERATE",
            "color": "#3b82f6"
        },
        {
            "id": "cond-high",
            "name": "High",
            "code": "HIGH_MONSOON",
            "description": "High Monsoon Storage (Surcharge Storage Active)",
            "water_level_m": 832.5,
            "storage_mm3": 3720.0,
            "reservoir_percentage": 105.1,
            "breach_risk_tier": "ELEVATED",
            "color": "#eab308"
        },
        {
            "id": "cond-maximum",
            "name": "Maximum",
            "code": "MWL",
            "description": "Maximum Water Level (Design Flood Spillway Capacity)",
            "water_level_m": 835.0,
            "storage_mm3": 3910.0,
            "reservoir_percentage": 110.5,
            "breach_risk_tier": "HIGH",
            "color": "#f97316"
        },
        {
            "id": "cond-extreme",
            "name": "Extreme Scenario",
            "code": "PMF_OVERTOPPING",
            "description": "PMF Cloudburst Overtopping at Dam Crest Level",
            "water_level_m": 839.5,
            "storage_mm3": 4250.0,
            "reservoir_percentage": 120.0,
            "breach_risk_tier": "CRITICAL",
            "color": "#ef4444"
        }
    ]


def get_tehri_dam_intelligence_data() -> Dict[str, Any]:
    """
    Returns complete Tehri Earth & Rockfill Dam & Reservoir Engineering Intelligence dataset.
    """
    dam_params = {
        "id": "dam-tehri-demo",
        "name": "Tehri Earth and Rockfill Dam",
        "river": "Bhagirathi River",
        "study_area_id": "sa-tehri-demo",
        "dam_type": "Rockfill",
        "material": "Earth-fill with Central Impervious Clay Core & Shell Rockfill",
        "height_m": 260.5,
        "crest_elevation_m": 839.5,
        "foundation_elevation_m": 579.0,
        "crest_length_m": 575.0,
        "crest_width_m": 20.0,
        "base_width_m": 1125.0,
        "upstream_slope": "1.15 H : 1 V",
        "downstream_slope": "2.0 H : 1 V",
        "construction_year": 2006,
        "spillway_capacity_m3s": 15540.0,
        "quality_status": "REAL"
    }

    reservoir_params = {
        "id": "res-tehri-001",
        "dam_id": "dam-tehri-demo",
        "name": "Tehri Hydroelectric Reservoir Pool",
        "area_km2": 42.0,
        "storage_capacity_mm3": 3540.0,
        "live_storage_mm3": 2615.0,
        "dead_storage_mm3": 925.0,
        "current_storage_mm3": 3200.0,
        "current_water_level_m": 822.4,
        "minimum_operating_level_m": 740.0,
        "normal_reservoir_level_m": 830.0,
        "maximum_reservoir_level_m": 835.0,
        "spillway_level_m": 815.0,
        "inflow_m3s": 1250.0,
        "outflow_m3s": 450.0,
        "quality_status": "REAL"
    }

    hydrostatics = compute_hydrostatic_parameters(
        water_level_m=reservoir_params["current_water_level_m"],
        foundation_elevation_m=dam_params["foundation_elevation_m"],
        crest_elevation_m=dam_params["crest_elevation_m"],
        spillway_level_m=reservoir_params["spillway_level_m"],
        crest_length_m=dam_params["crest_length_m"],
        storage_capacity_mm3=reservoir_params["storage_capacity_mm3"],
        normal_level_m=reservoir_params["normal_reservoir_level_m"]
    )

    return {
        "dam": dam_params,
        "reservoir": reservoir_params,
        "hydrostatics": hydrostatics,
        "condition_presets": get_reservoir_condition_presets()
    }
