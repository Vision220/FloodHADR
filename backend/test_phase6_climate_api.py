import sys
import os
import asyncio
from httpx import AsyncClient, ASGITransport

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.climate.climate_provider import (
    DemoClimateProjectionProvider,
    CMIPClimateProjectionProvider,
    CORDEXClimateProjectionProvider
)
from app.climate.climate_analyzer import (
    get_available_climate_providers,
    analyze_climate_risk_scenario
)

def test_climate_provider_architecture():
    print("\n--- 1. Testing Climate Projection Provider Architecture ---")
    providers = [
        DemoClimateProjectionProvider(),
        CMIPClimateProjectionProvider(),
        CORDEXClimateProjectionProvider()
    ]
    assert len(providers) == 3
    
    for p in providers:
        meta = p.get_provider_metadata()
        print(f"  [PROVIDER] {meta['provider_name']} ({meta['provider_id']})")
        print(f"    - Connected Status: {meta['connected']}")
        print(f"    - Quality Status: {meta['quality_status']}")
        print(f"    - Notice: {meta['notice']}")
        
        assert "notice" in meta
        assert meta["notice"] == "Climate dataset not connected — sensitivity/demo mode."
        assert meta["connected"] is False
    print("  [PASS] Climate Projection Provider architecture test PASSED")

def test_climate_scenario_horizons_and_sensitivity():
    print("\n--- 2. Testing Climate Scenario Horizons & Sensitivity Factors ---")
    demo_provider = DemoClimateProjectionProvider()
    horizons = ["Current", "2030", "2050", "2070", "2100"]
    ssps = ["SSP1-2.6", "SSP2-4.5", "SSP3-7.0", "SSP5-8.5"]
    
    for h in horizons:
        for ssp in ssps:
            factors = demo_provider.get_projection_factors(horizon_year=h, ssp_scenario=ssp)
            assert "rainfall_intensity_multiplier" in factors
            assert "runoff_response_factor" in factors
            assert "reservoir_inflow_multiplier" in factors
            assert factors["rainfall_intensity_multiplier"] >= 1.0
            
    print(f"  Verified scaling matrix across {len(horizons)} horizons and {len(ssps)} SSP scenarios.")
    print("  [PASS] Scenario horizons & sensitivity factors test PASSED")

def test_current_vs_future_climate_comparison():
    print("\n--- 3. Testing Current Climate vs Future Climate Scenario Comparison ---")
    res = analyze_climate_risk_scenario(
        horizon_year="2050",
        ssp_scenario="SSP3-7.0",
        provider_id="demo-sensitivity-climate",
        baseline_rainfall_mm=180.0,
        scs_cn=78.0
    )
    
    assert res["status"] == "SUCCESS"
    curr = res["current_climate"]
    fut = res["future_climate"]
    delta = res["delta_comparison"]
    
    print("  Hydrologic Metric Comparison (Current vs 2050 SSP3-7.0):")
    print(f"    * Rainfall Depth: {curr['rainfall_mm']} mm -> {fut['rainfall_mm']} mm (+{delta['rainfall_pct_change']}%)")
    print(f"    * Runoff Volume: {curr['runoff_volume_million_m3']} Mm3 -> {fut['runoff_volume_million_m3']} Mm3 (+{delta['runoff_volume_pct_change']}%)")
    print(f"    * Peak Discharge Q: {curr['peak_discharge_m3s']} m3/s -> {fut['peak_discharge_m3s']} m3/s (+{delta['peak_discharge_pct_change']}%)")
    print(f"    * Flood Inundation Area: {curr['flood_area_km2']} km2 -> {fut['flood_area_km2']} km2 (+{delta['flood_area_pct_change']}%)")
    print(f"    * Maximum Depth: {curr['max_water_depth_m']} m -> {fut['max_water_depth_m']} m (+{delta['max_depth_pct_change']}%)")
    print(f"    * Maximum Velocity: {curr['max_velocity_ms']} m/s -> {fut['max_velocity_ms']} m/s (+{delta['max_velocity_pct_change']}%)")

    # Mandatory Rigor Verification
    notice = res["data_rigor_notice"]
    print(f"  Data Rigor Notice: '{notice}'")
    assert notice == "Climate dataset not connected — sensitivity/demo mode."
    assert fut["peak_discharge_m3s"] > curr["peak_discharge_m3s"]
    assert fut["flood_area_km2"] > curr["flood_area_km2"]
    print("  [PASS] Current vs Future Climate comparison test PASSED")

async def test_climate_rest_api_endpoints():
    print("\n--- 4. Testing Climate REST API Endpoints ---")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/climate/providers
        res1 = await client.get("/api/climate/providers")
        assert res1.status_code == 200, f"Failed GET /api/climate/providers: {res1.text}"
        providers = res1.json()
        print(f"  GET /api/climate/providers -> Returned {len(providers)} providers")
        
        # GET /api/climate/horizons
        res2 = await client.get("/api/climate/horizons")
        assert res2.status_code == 200, f"Failed GET /api/climate/horizons: {res2.text}"
        horizons_data = res2.json()
        print(f"  GET /api/climate/horizons -> Returned {len(horizons_data['scenario_horizons'])} horizons")
        
        # POST /api/climate/analyze
        res3 = await client.post("/api/climate/analyze", json={
            "horizon_year": "2070",
            "ssp_scenario": "SSP5-8.5",
            "provider_id": "demo-sensitivity-climate",
            "baseline_rainfall_mm": 200.0,
            "scs_cn": 80.0
        })
        assert res3.status_code == 200, f"Failed POST /api/climate/analyze: {res3.text}"
        sim_data = res3.json()
        print(f"  POST /api/climate/analyze -> Future Q_peak = {sim_data['future_climate']['peak_discharge_m3s']} m3/s (+{sim_data['delta_comparison']['peak_discharge_pct_change']}%)")
        print(f"  Data Rigor Notice: '{sim_data['data_rigor_notice']}'")
        assert sim_data["data_rigor_notice"] == "Climate dataset not connected — sensitivity/demo mode."

    print("  [PASS] Climate REST API endpoints test PASSED")

def run_all_tests():
    print("================================================================")
    print(" FLOODHADR PHASE 6 - CLIMATE RISK & HAZARD PROJECTION TESTS")
    print("================================================================")
    test_climate_provider_architecture()
    test_climate_scenario_horizons_and_sensitivity()
    test_current_vs_future_climate_comparison()
    asyncio.run(test_climate_rest_api_endpoints())
    print("\n================================================================")
    print(" ALL PHASE 6 CLIMATE RISK TESTS PASSED SUCCESSFULLY! [OK]")
    print("================================================================")

if __name__ == "__main__":
    run_all_tests()
