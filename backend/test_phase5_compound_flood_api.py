import sys
import os
import asyncio
from httpx import AsyncClient, ASGITransport

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.gis.tributary_analyzer import (
    get_tributary_network_data,
    calculate_tributary_hydraulics
)
from app.gis.compound_flood_engine import (
    get_compound_scenario_presets,
    simulate_compound_flood_scenario
)

def test_tributary_network_data():
    print("\n--- 1. Testing Tributary Network Data ---")
    tribs = get_tributary_network_data()
    assert len(tribs) >= 4, f"Expected at least 4 tributaries, got {len(tribs)}"
    
    for t in tribs:
        print(f"  [TRIBUTARY] {t['name']} ({t['id']})")
        print(f"    - Catchment Area: {t['catchment_area_km2']} km²")
        print(f"    - Stream Order: {t['stream_order']}")
        print(f"    - Confluence Location: {t['confluence_node']} {t['coordinates']}")
        print(f"    - Normal Flow: {t['normal_discharge_m3s']} m³/s | Flash Flood: {t['flash_flood_discharge_m3s']} m³/s")
        
        assert "catchment_area_km2" in t
        assert "confluence_node" in t
        assert "coordinates" in t
    print("  [PASS] Tributary network data test PASSED")

def test_tributary_flow_regimes():
    print("\n--- 2. Testing Tributary Flow Regimes ---")
    regimes = ["NORMAL", "HIGH", "EXTREME", "FLASH_FLOOD", "COINCIDENT_PEAK"]
    
    for r in regimes:
        res = calculate_tributary_hydraulics("trib-bhilangna", flow_regime=r, rainfall_mm=180.0)
        print(f"  [REGIME: {r}] Q_peak = {res['peak_discharge_m3s']} m³/s | Velocity = {res['velocity_ms']} m/s | Arrival = {res['arrival_time_min']} min")
        assert res["peak_discharge_m3s"] > 0
        assert res["arrival_time_min"] > 0
        assert res["runoff_depth_mm"] >= 0
    print("  [PASS] Tributary flow regimes test PASSED")

def test_compound_scenario_presets():
    print("\n--- 3. Testing 5 Compound Scenario Range Presets ---")
    presets = get_compound_scenario_presets()
    assert len(presets) == 5, f"Expected 5 presets, got {len(presets)}"
    
    preset_names = [p["name"] for p in presets]
    print(f"  Presets defined: {preset_names}")
    expected_names = ["Minimum", "Normal", "High", "Maximum", "Extreme Stress Scenario"]
    assert preset_names == expected_names, f"Preset mismatch: {preset_names}"
    
    for p in presets:
        assert p["classification_label"] == "SCENARIO-BASED EXTREME CASE"
    print("  [PASS] Compound scenario range presets test PASSED")

def test_multi_hazard_superposition_simulation():
    print("\n--- 4. Testing Multi-Hazard Compound Flood Superposition ---")
    sim = simulate_compound_flood_scenario(
        scenario_preset_id="scen-extreme-stress",
        include_dam_breach=True,
        custom_rainfall_mm=350.0,
        tributary_regime="COINCIDENT_PEAK"
    )
    
    assert sim["status"] == "SUCCESS"
    hc = sim["hazard_components"]
    cd = sim["combined_downstream_hydraulics"]
    sc = sim["statistical_classification"]
    
    print("  Hazard Superposition Breakdown:")
    print(f"    - Main River Flow: {hc['main_river_flow_m3s']} m³/s")
    print(f"    - Spillway Outflow: {hc['reservoir_spillway_release_m3s']} m³/s")
    print(f"    - Dam Breach Outflow: {hc['dam_breach_outflow_m3s']} m³/s")
    print(f"    - Total Tributaries Discharge: {hc['total_tributaries_discharge_m3s']} m³/s")
    print(f"  Combined Downstream Hydraulics:")
    print(f"    - Combined Q_peak: {cd['combined_peak_discharge_m3s']} m³/s")
    print(f"    - Combined Water Depth: {cd['combined_water_depth_m']} m")
    print(f"    - Combined Velocity: {cd['combined_velocity_ms']} m/s")
    print(f"    - Peak Arrival Time: {cd['downstream_peak_arrival_time_hr']} hours")
    print(f"  Confluence Junctions:")
    for cj in sim["confluence_junctions"]:
        print(f"    * {cj['junction_name']} ({cj['tributary_name']}): Q = {cj['tributary_discharge_m3s']} m3/s ({cj['contribution_percentage']}%) | dh = +{cj['backwater_stage_increase_m']}m")

    # Strict Probability Directive Verification
    print(f"  Statistical Label: {sc['label']}")
    assert sc["label"] == "SCENARIO-BASED EXTREME CASE"
    assert "probability" not in str(cd).lower() or "uncalibrated" in sc["probability_statement"].lower()
    assert cd["combined_peak_discharge_m3s"] > 50000.0, "Extreme stress scenario discharge should reflect breach + coincident surge"
    print("  [PASS] Multi-hazard superposition test PASSED")

async def test_compound_flood_api_endpoints():
    print("\n--- 5. Testing Compound Flood REST API Endpoints ---")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/tributaries
        res1 = await client.get("/api/tributaries")
        assert res1.status_code == 200, f"Failed GET /api/tributaries: {res1.text}"
        tribs = res1.json()
        print(f"  GET /api/tributaries -> Returned {len(tribs)} tributaries")
        
        # GET /api/tributaries/{tributary_id}
        res2 = await client.get("/api/tributaries/trib-bhilangna?flow_regime=FLASH_FLOOD&rainfall_mm=250")
        assert res2.status_code == 200, f"Failed GET /api/tributaries/trib-bhilangna: {res2.text}"
        hydr = res2.json()
        print(f"  GET /api/tributaries/trib-bhilangna -> Q_peak = {hydr['peak_discharge_m3s']} m³/s")
        
        # GET /api/compound-flood/scenarios
        res3 = await client.get("/api/compound-flood/scenarios")
        assert res3.status_code == 200
        scenarios = res3.json()
        print(f"  GET /api/compound-flood/scenarios -> Returned {len(scenarios)} presets")
        
        # POST /api/compound-flood/simulate
        res4 = await client.post("/api/compound-flood/simulate", json={
            "scenario_preset_id": "scen-maximum",
            "include_dam_breach": False,
            "custom_rainfall_mm": 220.0,
            "tributary_regime": "FLASH_FLOOD"
        })
        assert res4.status_code == 200, f"Failed POST /api/compound-flood/simulate: {res4.text}"
        sim_data = res4.json()
        print(f"  POST /api/compound-flood/simulate -> Combined Q = {sim_data['combined_downstream_hydraulics']['combined_peak_discharge_m3s']} m³/s")
        print(f"  Statistical Classification: {sim_data['statistical_classification']['label']}")
        assert sim_data["statistical_classification"]["label"] == "SCENARIO-BASED EXTREME CASE"

    print("  [PASS] Compound Flood REST API endpoints test PASSED")

def run_all_tests():
    print("================================================================")
    print(" FLOODHADR PHASE 5 - COMPOUND & TRIBUTARY FLOOD ENGINE TESTS")
    print("================================================================")
    test_tributary_network_data()
    test_tributary_flow_regimes()
    test_compound_scenario_presets()
    test_multi_hazard_superposition_simulation()
    asyncio.run(test_compound_flood_api_endpoints())
    print("\n================================================================")
    print(" ALL PHASE 5 COMPOUND FLOOD TESTS PASSED SUCCESSFULLY! [OK]")
    print("================================================================")

if __name__ == "__main__":
    run_all_tests()
