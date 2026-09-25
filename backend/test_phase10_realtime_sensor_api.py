import sys
import os
import asyncio
from httpx import AsyncClient, ASGITransport

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.sensors.sensor_provider import DemoSensorProvider, CWCSensorProvider
from app.sensors.telemetry_engine import TelemetryEngine

def test_sensor_provider_architecture():
    print("\n--- 1. Testing SensorProvider Architecture ---")
    provider = DemoSensorProvider()
    meta = provider.get_provider_metadata()
    print(f"  [PROVIDER] {meta['provider_name']} ({meta['provider_id']})")
    print(f"    - Source Type: {meta['source_type']}")
    print(f"    - Quality Status: {meta['quality_status']}")
    print(f"    - Notice: {meta['notice']}")

    assert meta["notice"] == "SIMULATED LIVE DATA"
    assert meta["quality_status"] == "SIMULATED LIVE DATA"
    print("  [PASS] SensorProvider architecture test PASSED")

def test_live_telemetry_streams():
    print("\n--- 2. Testing Live Sensor Telemetry Streams ---")
    provider = DemoSensorProvider()
    readings = provider.get_live_readings()

    assert readings["live_status"] == "ONLINE"
    assert "last_updated" in readings
    assert readings["data_notice"] == "SIMULATED LIVE DATA"
    sensors = readings["sensors"]
    assert len(sensors) >= 6, f"Expected at least 6 sensors, got {len(sensors)}"

    print(f"  Live Status: {readings['live_status']} | Last Updated: {readings['last_updated']}")
    for s in sensors:
        print(f"    * [{s['sensor_type']}] {s['name']} ({s['location']}) - Battery: {s.get('battery_percent', 100.0)}%")

    # Assert presence of required sensor types
    types = [s["sensor_type"] for s in sensors]
    assert "AWS_RAIN_GAUGE" in types
    assert "RADAR_RIVER_STAGE" in types
    assert "CWC_DISCHARGE_TELEMETER" in types
    assert "RESERVOIR_ULTRASONIC" in types
    assert "DOPPLER_VELOCITY_RADAR" in types
    assert "SATELLITE_SAR_EO" in types
    print("  [PASS] Live telemetry streams test PASSED")

def test_time_series_historical_trends():
    print("\n--- 3. Testing 24-Hour Telemetry Time-Series Trends ---")
    provider = DemoSensorProvider()
    ts_data = provider.get_time_series_data(duration_hr=24)

    assert ts_data["duration_hr"] == 24
    assert ts_data["data_notice"] == "SIMULATED LIVE DATA"
    series = ts_data["time_series"]
    assert len(series) == 25, f"Expected 25 time steps for 24h, got {len(series)}"

    print(f"  Generated {len(series)} time-series data points for charts.")
    print(f"  Sample point (t=12h): Rain = {series[12]['rainfall_mm_hr']} mm/h | Stage = {series[12]['river_level_m']} m | Q = {series[12]['discharge_m3s']} m3/s")
    print("  [PASS] Time-series historical trends test PASSED")

def test_telemetry_to_scenario_coupling():
    print("\n--- 4. Testing Real-Time Telemetry to Hydrodynamic Scenario Coupling ---")
    engine = TelemetryEngine()
    coupled_res = engine.feed_live_telemetry_to_scenario(scenario_envelope="EXTREME")

    assert coupled_res["status"] == "SUCCESS"
    assert coupled_res["data_notice"] == "SIMULATED LIVE DATA"
    obs = coupled_res["live_input_observations"]
    outs = coupled_res["hydrodynamic_simulation_results"]["hydrodynamic_outputs"]

    print(f"  Live Inputs Fed: Rain = {obs['live_rainfall_mm']} mm | Res Level = {obs['live_reservoir_level_m']} m | Q_obs = {obs['live_observed_discharge_m3s']} m3/s")
    print(f"  Coupled 2D Output: Combined Q = {outs['combined_peak_discharge_m3s']} m3/s | Depth = {outs['max_water_depth_m']} m | Area = {outs['flood_inundation_area_km2']} km2")

    assert outs["combined_peak_discharge_m3s"] > 10000.0
    print("  [PASS] Telemetry to scenario coupling test PASSED")

async def test_realtime_sensor_rest_api_endpoints():
    print("\n--- 5. Testing Real-Time Sensors REST API Endpoints ---")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/sensors/live-status
        res1 = await client.get("/api/sensors/live-status")
        assert res1.status_code == 200, f"Failed GET /api/sensors/live-status: {res1.text}"
        live_json = res1.json()
        print(f"  GET /api/sensors/live-status -> Status: {live_json['live_status']} | Notice: '{live_json['data_notice']}'")
        assert live_json["data_notice"] == "SIMULATED LIVE DATA"

        # GET /api/sensors/time-series
        res2 = await client.get("/api/sensors/time-series?duration_hr=24")
        assert res2.status_code == 200, f"Failed GET /api/sensors/time-series: {res2.text}"
        ts_json = res2.json()
        print(f"  GET /api/sensors/time-series -> Returned {len(ts_json['time_series'])} points")

        # POST /api/sensors/trigger-refresh
        res3 = await client.post("/api/sensors/trigger-refresh")
        assert res3.status_code == 200, f"Failed POST /api/sensors/trigger-refresh: {res3.text}"
        ref_json = res3.json()
        print(f"  POST /api/sensors/trigger-refresh -> Updated Timestamp: {ref_json['last_updated']}")

        # POST /api/sensors/feed-to-scenario
        res4 = await client.post("/api/sensors/feed-to-scenario", json={"scenario_envelope": "EXTREME"})
        assert res4.status_code == 200, f"Failed POST /api/sensors/feed-to-scenario: {res4.text}"
        c_json = res4.json()
        print(f"  POST /api/sensors/feed-to-scenario -> Peak Q = {c_json['hydrodynamic_simulation_results']['hydrodynamic_outputs']['combined_peak_discharge_m3s']} m3/s")
        assert c_json["data_notice"] == "SIMULATED LIVE DATA"

    print("  [PASS] Real-Time sensors REST API endpoints test PASSED")

def run_all_tests():
    print("================================================================")
    print(" FLOODHADR PHASE 10 - REAL-TIME FLOOD INTELLIGENCE TESTS")
    print("================================================================")
    test_sensor_provider_architecture()
    test_live_telemetry_streams()
    test_time_series_historical_trends()
    test_telemetry_to_scenario_coupling()
    asyncio.run(test_realtime_sensor_rest_api_endpoints())
    print("\n================================================================")
    print(" ALL PHASE 10 REAL-TIME SENSOR TESTS PASSED SUCCESSFULLY! [OK]")
    print("================================================================")

if __name__ == "__main__":
    run_all_tests()
