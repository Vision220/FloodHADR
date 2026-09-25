import math
from typing import Dict, Any, List, Optional

def get_known_landslide_inventory() -> List[Dict[str, Any]]:
    """
    Returns verified inventory of historical & monitored landslide hazard sites in Tehri/Bhagirathi Basin.
    """
    return [
        {
            "id": "ls-koti-nala",
            "name": "Koti Nala Slope Debris Avalanche",
            "location_name": "Tehri Reservoir Right Flank (km 38.0)",
            "coordinates": {"lat": 30.42, "lng": 78.48},
            "river_km": 38.0,
            "slope_deg": 42.5,
            "elevation_m": 1250.0,
            "geology": "Grade III/IV Heavily Weathered Quartzite & Phyllites",
            "soil_type": "Colluvial Loose Scree / Unconsolidated Debris",
            "land_cover": "Barren / Degraded Slope",
            "estimated_volume_m3": 1500000.0,
            "susceptibility_class": "VERY HIGH",
            "blockage_potential": "HIGH",
            "quality_status": "MONITORED"
        },
        {
            "id": "ls-dharali",
            "name": "Dharali Torrential Landslide",
            "location_name": "Upper Bhagirathi Valley Reach (km 96.0)",
            "coordinates": {"lat": 30.95, "lng": 78.85},
            "river_km": 96.0,
            "slope_deg": 48.0,
            "elevation_m": 2680.0,
            "geology": "Granitic Gneiss & Morainic Debris",
            "soil_type": "Glacial Scree / Bouldery Till",
            "land_cover": "Sparse Alpine Vegetation",
            "estimated_volume_m3": 2800000.0,
            "susceptibility_class": "EXTREME",
            "blockage_potential": "VERY HIGH",
            "quality_status": "HISTORICAL (2021 EVENT)"
        },
        {
            "id": "ls-bhilangna-confluence",
            "name": "Bhilangna Right Bank Rockfall",
            "location_name": "Old Tehri Confluence Reach (km 42.5)",
            "coordinates": {"lat": 30.38, "lng": 78.48},
            "river_km": 42.5,
            "slope_deg": 38.0,
            "elevation_m": 890.0,
            "geology": "Fractured Slate & Chlorite Schist",
            "soil_type": "Rocky Outcrop & Residual Soil",
            "land_cover": "Scrub Forest / Roadslope Cut",
            "estimated_volume_m3": 850000.0,
            "susceptibility_class": "HIGH",
            "blockage_potential": "MODERATE",
            "quality_status": "MONITORED"
        },
        {
            "id": "ls-sukhi-top",
            "name": "Sukhi Top Massive Rock Slide",
            "location_name": "Middle Bhagirathi Gorge (km 72.0)",
            "coordinates": {"lat": 30.82, "lng": 78.68},
            "river_km": 72.0,
            "slope_deg": 52.0,
            "elevation_m": 2150.0,
            "geology": "MCT Thrust Zone Jointed Gneiss",
            "soil_type": "Rockfall Scree",
            "land_cover": "Barren Cliff Edge",
            "estimated_volume_m3": 4200000.0,
            "susceptibility_class": "EXTREME",
            "blockage_potential": "CRITICAL",
            "quality_status": "HIGH RISK"
        }
    ]


def calculate_landslide_susceptibility(
    slope_deg: float = 38.0,
    elevation_m: float = 1450.0,
    trigger_rainfall_mm: float = 180.0,
    soil_type: str = "COLLUVIAL", # COLLUVIAL | ALLUVIAL | RESIDUAL | ROCKFALL
    geology_type: str = "PHYLLITE_SCHIST", # GRANITE | GNEISS | PHYLLITE_SCHIST | SANDSTONE
    land_cover: str = "BARREN_DEGRADED" # DENSE_FOREST | SPARSE_FOREST | SCRUB | BARREN_DEGRADED
) -> Dict[str, Any]:
    """
    Calculates Landslide Susceptibility Index (LSI) from terrain, geotechnical, and hydrological parameters.
    Returns score (0.0 to 1.0) and susceptibility category.
    """
    # 1. Slope Factor Score (0.0 to 1.0)
    # Slope < 15 deg = low risk, 15-30 = moderate, 30-45 = high, >45 = extreme
    if slope_deg < 15.0:
        s_score = 0.15
    elif slope_deg < 30.0:
        s_score = 0.45
    elif slope_deg < 45.0:
        s_score = 0.82
    else:
        s_score = 0.98

    # 2. Elevation / Relief Factor (High altitude steep valleys have greater gravitational energy)
    if elevation_m < 800.0:
        e_score = 0.25
    elif elevation_m < 2000.0:
        e_score = 0.65
    else:
        e_score = 0.90

    # 3. Trigger Rainfall Factor
    if trigger_rainfall_mm < 50.0:
        r_score = 0.10
    elif trigger_rainfall_mm < 120.0:
        r_score = 0.50
    elif trigger_rainfall_mm < 250.0:
        r_score = 0.85
    else:
        r_score = 1.00 # Cloudburst threshold

    # 4. Soil & Geology Factor
    g_map = {
        "PHYLLITE_SCHIST": 0.90,
        "ROCKFALL": 0.85,
        "COLLUVIAL": 0.80,
        "RESIDUAL": 0.55,
        "SANDSTONE": 0.45,
        "GNEISS": 0.40,
        "GRANITE": 0.30
    }
    g_score = g_map.get(geology_type.upper(), g_map.get(soil_type.upper(), 0.65))

    # 5. Land Cover Vegetation Protection Factor
    l_map = {
        "BARREN_DEGRADED": 0.95,
        "SCRUB": 0.70,
        "SPARSE_FOREST": 0.45,
        "DENSE_FOREST": 0.15
    }
    l_score = l_map.get(land_cover.upper(), 0.70)

    # Weighted Multi-Factor Index: LSI = 0.30*S + 0.15*E + 0.25*R + 0.15*G + 0.15*L
    lsi = round(0.30 * s_score + 0.15 * e_score + 0.25 * r_score + 0.15 * g_score + 0.15 * l_score, 3)

    if lsi < 0.35:
        category = "LOW"
        color = "#38bdf8"
    elif lsi < 0.58:
        category = "MODERATE"
        color = "#eab308"
    elif lsi < 0.78:
        category = "HIGH"
        color = "#f97316"
    else:
        category = "CRITICAL / EXTREME"
        color = "#ef4444"

    return {
        "susceptibility_index": lsi,
        "susceptibility_category": category,
        "risk_color": color,
        "factor_breakdown": {
            "slope_score": s_score,
            "elevation_score": e_score,
            "trigger_rainfall_score": r_score,
            "geology_soil_score": g_score,
            "land_cover_score": l_score
        },
        "geotechnical_notice": "SIMPLIFIED GEOTECHNICAL SCENARIO — NOT GEOLOGICAL PREDICTION"
    }
