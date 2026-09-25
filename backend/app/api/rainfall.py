from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Dict, Any, Optional

from app.rainfall import (
    DemoRainfallProvider,
    HistoricalRainfallProvider,
    ForecastRainfallProvider,
    calculate_scs_cn_runoff,
    compute_scs_runoff_hydrograph,
    adjust_cn_for_amc
)

router = APIRouter(prefix="", tags=["Rainfall & SCS-CN Runoff Intelligence"])

@router.get("/rainfall")
async def get_rainfall(
    provider_type: str = Query("DEMO", description="DEMO | HISTORICAL | FORECAST"),
    catchment_id: str = Query("cat-bhagirathi-001"),
    duration_hr: float = Query(24.0)
):
    """
    Fetch rainfall time series, cumulative rainfall, intensity, duration, antecedent rainfall, and provider metadata.
    Distinguishes OBSERVED, FORECAST, DEMO, and SYNTHETIC datasets.
    """
    provider_upper = provider_type.upper()
    if provider_upper in ["HISTORICAL", "OBSERVED", "AWS"]:
        provider = HistoricalRainfallProvider()
    elif provider_upper in ["FORECAST", "NWP", "GFS"]:
        provider = ForecastRainfallProvider()
    else:
        provider = DemoRainfallProvider()

    series_data = provider.get_rainfall_series(catchment_id=catchment_id, duration_hr=duration_hr)
    return series_data


@router.get("/forecast")
async def get_rainfall_forecast(
    catchment_id: str = Query("cat-bhagirathi-001"),
    duration_hr: float = Query(72.0)
):
    """
    Fetch GFS / NCMRWF numerical weather prediction forecast ensemble feed.
    Clearly labeled FORECAST data.
    """
    provider = ForecastRainfallProvider()
    return provider.get_rainfall_series(catchment_id=catchment_id, duration_hr=duration_hr)


@router.post("/scs-cn/calculate")
async def calculate_scs_cn(payload: Dict[str, Any] = Body(...)):
    """
    Calculates SCS Curve Number runoff depth, retention S, initial abstraction Ia, runoff volume,
    and direct runoff hydrograph.
    Equations:
    S = 25400/CN - 254
    Ia = lambda * S
    Q = (P - Ia)^2 / (P - Ia + S) for P > Ia
    """
    rainfall_p_mm = float(payload.get("rainfall_p_mm", 180.0))
    cn_value = float(payload.get("cn_value", 78.0))
    amc = str(payload.get("amc", "AMC_II"))
    lambda_val = float(payload.get("lambda_val", 0.20))
    catchment_area_km2 = float(payload.get("catchment_area_km2", 1240.0))
    time_of_concentration_hr = float(payload.get("time_of_concentration_hr", 6.4))
    provider_type = str(payload.get("provider_type", "DEMO"))

    # Fetch rainfall time series
    if provider_type.upper() in ["HISTORICAL", "OBSERVED"]:
        provider = HistoricalRainfallProvider()
    elif provider_type.upper() in ["FORECAST"]:
        provider = ForecastRainfallProvider()
    else:
        provider = DemoRainfallProvider()

    rf_data = provider.get_rainfall_series(catchment_id="cat-bhagirathi-001")
    rf_series = rf_data["rainfall_series"]

    # Compute hydrograph
    hydrograph_data = compute_scs_runoff_hydrograph(
        rainfall_series=rf_series,
        cn_value=cn_value,
        amc=amc,
        lambda_val=lambda_val,
        catchment_area_km2=catchment_area_km2,
        time_of_concentration_hr=time_of_concentration_hr
    )

    return {
        "status": "SUCCESS",
        "provider_metadata": rf_data["provider"],
        "inputs": {
            "rainfall_p_mm": rainfall_p_mm,
            "cn_base": cn_value,
            "amc": amc,
            "lambda_val": lambda_val,
            "catchment_area_km2": catchment_area_km2,
            "time_of_concentration_hr": time_of_concentration_hr
        },
        "scs_cn_results": hydrograph_data["summary"],
        "hydrograph_data": hydrograph_data
    }


@router.get("/scs-cn/cn-matrix")
async def get_cn_lookup_matrix():
    """
    Returns reference Curve Number lookup matrix based on Hydrologic Soil Groups (HSG A, B, C, D)
    and Land Use / Land Cover types.
    """
    return {
        "hydrologic_soil_groups": {
            "HSG_A": "High Infiltration (Sand / Deep Gravel)",
            "HSG_B": "Moderate Infiltration (Sandy Loam / Fine Loam)",
            "HSG_C": "Low Infiltration (Clay Loam / Shallow Soil)",
            "HSG_D": "Very Low Infiltration (Heavy Clay / Bare Rock / Glacier)"
        },
        "cn_matrix": [
            {"land_use": "Dense Himalayan Forest", "hsg_a": 36, "hsg_b": 60, "hsg_c": 73, "hsg_d": 79},
            {"land_use": "Agricultural Terraces", "hsg_a": 62, "hsg_b": 71, "hsg_c": 78, "hsg_d": 81},
            {"land_use": "Sparse Scrub / Grassland", "hsg_a": 49, "hsg_b": 69, "hsg_c": 79, "hsg_d": 84},
            {"land_use": "Urban / Built-up Impervious", "hsg_a": 77, "hsg_b": 85, "hsg_c": 90, "hsg_d": 92},
            {"land_use": "Bare Rock / Glacier / Steep Slope", "hsg_a": 77, "hsg_b": 86, "hsg_c": 91, "hsg_d": 94},
            {"land_use": "Water Body / Impounded Reservoir", "hsg_a": 100, "hsg_b": 100, "hsg_c": 100, "hsg_d": 100}
        ]
    }
