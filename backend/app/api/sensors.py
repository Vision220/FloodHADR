from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Dict, Any, Optional

from app.sensors.telemetry_engine import TelemetryEngine

router = APIRouter(prefix="", tags=["Real-Time Flood Intelligence & Sensors"])
telemetry_engine = TelemetryEngine()

@router.get("/sensors/live-status")
async def get_live_sensor_status():
    """
    Fetch LIVE STATUS, last updated timestamp, and live sensor readings for:
    Rainfall, River Level, Discharge, Reservoir Level, Velocity, Weather, and Satellite EO Feed.
    Includes mandatory label: 'SIMULATED LIVE DATA'.
    """
    return telemetry_engine.get_live_status_and_readings()


@router.get("/sensors/time-series")
async def get_sensor_time_series(duration_hr: int = Query(24, ge=1, le=168)):
    """Fetch 24-hour historical time-series telemetry trends for charts."""
    return telemetry_engine.get_historical_time_series(duration_hr)


@router.post("/sensors/trigger-refresh")
async def trigger_sensor_refresh():
    """Triggers an automatic telemetry polling refresh and returns updated live status."""
    return telemetry_engine.get_live_status_and_readings()


@router.post("/sensors/feed-to-scenario")
async def feed_telemetry_to_scenario(payload: Dict[str, Any] = Body(...)):
    """
    Connects real-time observations directly to hydrodynamic scenario calculations.
    Feeds live rainfall, reservoir level, and river discharge into the 2D flood solver.
    """
    scenario_envelope = str(payload.get("scenario_envelope", "EXTREME"))
    return telemetry_engine.feed_live_telemetry_to_scenario(scenario_envelope)
