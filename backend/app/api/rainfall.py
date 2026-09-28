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
from app.hydrology.hydrology_pipeline import (
    HydrologicalSourceAgency,
    HydrologyDataMode,
    WeatherDataset,
    run_authoritative_hydrology_pipeline
)

router = APIRouter(prefix="", tags=["Rainfall & SCS-CN Runoff Intelligence"])

@router.get("/rainfall")
async def get_rainfall(
    provider_type: str = Query("DEMO", description="DEMO | HISTORICAL | FORECAST | IMD | CWC | THDC | WRIS | BHUVAN"),
    mode: str = Query("OBSERVED", description="OBSERVED | HISTORICAL | CLIMATOLOGICAL | EXTREME | DESIGN | SCENARIO | USER_DEFINED"),
    catchment_id: str = Query("cat-bhagirathi-001"),
    duration_hr: float = Query(24.0),
    is_live: bool = Query(False)
):
    """
    Fetch rainfall time series, cumulative rainfall, intensity, duration, antecedent rainfall, and provider metadata.
    Supports official agencies: IMD, CWC, THDC, India-WRIS, Bhuvan/NRSC across 7 data modes.
    Explicitly tags DEMO DATA when live feeds are offline.
    """
    pipeline_res = run_authoritative_hydrology_pipeline(
        source_agency=provider_type,
        mode=mode,
        duration_hr=duration_hr,
        is_live=is_live
    )
    return pipeline_res["weather_dataset"]


@router.get("/rainfall/sources")
async def get_rainfall_sources():
    """
    Returns registered authoritative hydrological data agencies and supported modes.
    Agencies: IMD, CWC, THDC, India-WRIS, Bhuvan/NRSC.
    Modes: OBSERVED, HISTORICAL, CLIMATOLOGICAL, EXTREME, DESIGN, SCENARIO, USER_DEFINED.
    """
    return {
        "agencies": [
            {
                "agency_code": "IMD",
                "agency_name": "India Meteorological Department (IMD)",
                "dataset_types": ["Automatic Weather Station (AWS)", "Gridded Rainfall 0.25°", "Monsoon Outlook"],
                "update_frequency": "Hourly",
                "status": "DEMO DATA (Live API offline - using telemetry baseline archive)"
            },
            {
                "agency_code": "CWC",
                "agency_name": "Central Water Commission (CWC)",
                "dataset_types": ["River Gauge Hydrograph", "Reservoir Storage Telemetry", "Flood Forecast"],
                "update_frequency": "Hourly",
                "status": "DEMO DATA (Live API offline - using historical telemetry archive)"
            },
            {
                "agency_code": "THDC",
                "agency_name": "THDC India Limited (Tehri Dam Control)",
                "dataset_types": ["Tehri Dam Level", "Spillway Discharge", "Powerhouse Inflow"],
                "update_frequency": "Real-time 15-min",
                "status": "DEMO DATA (Live SCADA offline - using official THDC parameter database)"
            },
            {
                "agency_code": "India-WRIS",
                "agency_name": "Water Resources Information System (India-WRIS)",
                "dataset_types": ["Basin Hydrology", "Sub-catchment Runoff", "Sensor Networks"],
                "update_frequency": "Daily",
                "status": "DEMO DATA (Live API offline - using WRIS GIS boundary baseline)"
            },
            {
                "agency_code": "Bhuvan/NRSC",
                "agency_name": "ISRO Bhuvan / National Remote Sensing Centre",
                "dataset_types": ["Satellite Altimetry", "CartoDEM 30m", "Land Cover Dynamics"],
                "update_frequency": "Periodic Satellite Passes",
                "status": "DEMO DATA (Offline mode active)"
            }
        ],
        "supported_modes": [
            "OBSERVED", "HISTORICAL", "CLIMATOLOGICAL", "EXTREME", "DESIGN", "SCENARIO", "USER_DEFINED"
        ]
    }


@router.post("/hydrology/pipeline")
async def execute_hydrology_pipeline(payload: Dict[str, Any] = Body(...)):
    """
    Executes the authoritative 7-stage Hydrological Pipeline:
    RAINFALL (IMD/CWC/THDC/WRIS/Bhuvan) -> CATCHMENT (SCS-CN) -> RUNOFF -> ROUTING -> INFLOW -> RESERVOIR -> SPILLWAY -> DOWNSTREAM HYDROGRAPH.
    Prevents direct 1:1 conversion of September rainfall into dam inflow.
    """
    source_agency = str(payload.get("source_agency", "IMD"))
    mode = str(payload.get("mode", "OBSERVED"))
    rainfall_mm = float(payload.get("rainfall_mm", 180.0))
    duration_hr = float(payload.get("duration_hr", 24.0))
    cn_value = float(payload.get("cn_value", 78.0))
    amc = str(payload.get("amc", "AMC_II"))
    catchment_area_km2 = float(payload.get("catchment_area_km2", 1240.0))
    time_of_concentration_hr = float(payload.get("time_of_concentration_hr", 6.4))
    initial_water_level_m = float(payload.get("initial_water_level_m", 830.0))
    is_live = bool(payload.get("is_live", False))

    res = run_authoritative_hydrology_pipeline(
        source_agency=source_agency,
        mode=mode,
        rainfall_mm=rainfall_mm,
        duration_hr=duration_hr,
        cn_value=cn_value,
        amc=amc,
        catchment_area_km2=catchment_area_km2,
        time_of_concentration_hr=time_of_concentration_hr,
        initial_water_level_m=initial_water_level_m,
        is_live=is_live
    )
    return res


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

    if provider_type.upper() in ["HISTORICAL", "OBSERVED"]:
        provider = HistoricalRainfallProvider()
    elif provider_type.upper() in ["FORECAST"]:
        provider = ForecastRainfallProvider()
    else:
        provider = DemoRainfallProvider()

    rf_data = provider.get_rainfall_series(catchment_id="cat-bhagirathi-001")
    rf_series = rf_data["rainfall_series"]

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

