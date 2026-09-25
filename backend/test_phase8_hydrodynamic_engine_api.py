import sys
import os
import asyncio
from httpx import AsyncClient, ASGITransport

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.simulation.hydrodynamic_engine import HydrodynamicEngine

def test_hydrodynamic_scenario_envelopes_monotonicity():
    print("\n--- 1. Testing 5 Hydrodynamic Scenario Envelopes (MINIMUM to EXTREME) ---")
    engine = HydrodynamicEngine()
    envelopes = ["MINIMUM", "NORMAL", "HIGH", "MAXIMUM", "EXTREME"]
    results = {}

    for env in envelopes:
        res = engine.run_simulation(scenario_envelope=env)
        assert res["status"] == "SUCCESS"
        out = res["hydrodynamic_outputs"]
        inp = res["hydrodynamic_inputs"]
        results[env] = out
        
        print(f"  [ENVELOPE: {env}]")
        print(f"    - Rain: {inp['rainfall_mm']}mm | CN: {inp['scs_cn']} | Breach: {inp['dam_breach_active']} (w={inp['breach_width_m']}m)")
        print(f"    - Peak Discharge Q: {out['combined_peak_discharge_m3s']} m3/s")
        print(f"    - Max Water Depth h: {out['max_water_depth_m']} m | Max WSE: {out['max_wse_m']} m")
        print(f"    - Max Velocity V: {out['max_velocity_ms']} m/s | Arrival: {out['peak_arrival_time_min']} min")
        print(f"    - Flood Inundation Area: {out['flood_inundation_area_km2']} km2 | Duration: {out['flood_duration_hr']} hrs")

    # DYNAMIC RESPONSIVENESS VERIFICATION: Assert logical monotonicity
    print("\n  Verifying Dynamic Responsiveness (Non-hardcoded Output Scaling):")
    q_min = results["MINIMUM"]["combined_peak_discharge_m3s"]
    q_norm = results["NORMAL"]["combined_peak_discharge_m3s"]
    q_high = results["HIGH"]["combined_peak_discharge_m3s"]
    q_max = results["MAXIMUM"]["combined_peak_discharge_m3s"]
    q_ext = results["EXTREME"]["combined_peak_discharge_m3s"]

    print(f"    Q_peak: MIN({q_min}) < NORM({q_norm}) < HIGH({q_high}) < MAX({q_max}) < EXT({q_ext})")
    assert q_min < q_norm < q_high < q_max < q_ext, "Peak discharge must increase monotonically across envelopes"

    h_min = results["MINIMUM"]["max_water_depth_m"]
    h_ext = results["EXTREME"]["max_water_depth_m"]
    print(f"    Depth h: MIN({h_min}m) < EXT({h_ext}m)")
    assert h_min < h_ext, "Water depth must increase with larger scenario envelopes"

    area_min = results["MINIMUM"]["flood_inundation_area_km2"]
    area_ext = results["EXTREME"]["flood_inundation_area_km2"]
    print(f"    Area: MIN({area_min}km2) < EXT({area_ext}km2)")
    assert area_min < area_ext, "Flood area must increase with larger scenario envelopes"

    print("  [PASS] Hydrodynamic scenario envelopes monotonicity test PASSED")

def test_custom_input_sensitivity():
    print("\n--- 2. Testing Custom Input Sensitivity (Rainfall, Breach Width, Manning n) ---")
    engine = HydrodynamicEngine()

    # Test A: Varying Rainfall (100mm vs 300mm)
    res_r100 = engine.run_simulation(scenario_envelope="HIGH", custom_rainfall_mm=100.0)
    res_r300 = engine.run_simulation(scenario_envelope="HIGH", custom_rainfall_mm=300.0)
    q100 = res_r100["hydrodynamic_outputs"]["combined_peak_discharge_m3s"]
    q300 = res_r300["hydrodynamic_outputs"]["combined_peak_discharge_m3s"]
    print(f"  Rainfall Sensitivity: 100mm -> Q = {q100} m3/s | 300mm -> Q = {q300} m3/s")
    assert q300 > q100

    # Test B: Varying Breach Width (40m vs 180m)
    res_w40 = engine.run_simulation(scenario_envelope="EXTREME", custom_breach_width_m=40.0, include_dam_breach=True)
    res_w180 = engine.run_simulation(scenario_envelope="EXTREME", custom_breach_width_m=180.0, include_dam_breach=True)
    qw40 = res_w40["hydrodynamic_outputs"]["combined_peak_discharge_m3s"]
    qw180 = res_w180["hydrodynamic_outputs"]["combined_peak_discharge_m3s"]
    print(f"  Breach Width Sensitivity: 40m -> Q = {qw40} m3/s | 180m -> Q = {qw180} m3/s")
    assert qw180 > qw40

    # Test C: Dam Breach Toggle (Intact Dam vs Dam Breach)
    res_intact = engine.run_simulation(scenario_envelope="HIGH", include_dam_breach=False)
    res_breach = engine.run_simulation(scenario_envelope="HIGH", include_dam_breach=True)
    q_intact = res_intact["hydrodynamic_outputs"]["combined_peak_discharge_m3s"]
    q_breach = res_breach["hydrodynamic_outputs"]["combined_peak_discharge_m3s"]
    print(f"  Dam Breach Toggle: Intact Dam -> Q = {q_intact} m3/s | Dam Breach -> Q = {q_breach} m3/s")
    assert q_breach > q_intact

    print("  [PASS] Custom input sensitivity test PASSED")

async def test_hydrodynamics_rest_api_endpoints():
    print("\n--- 3. Testing Next-Gen Hydrodynamics REST API Endpoints ---")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/hydrodynamics/scenarios
        res1 = await client.get("/api/hydrodynamics/scenarios")
        assert res1.status_code == 200, f"Failed GET /api/hydrodynamics/scenarios: {res1.text}"
        scenarios = res1.json()
        print(f"  GET /api/hydrodynamics/scenarios -> Returned {len(scenarios)} envelopes")
        
        # POST /api/hydrodynamics/simulate
        res2 = await client.post("/api/hydrodynamics/simulate", json={
            "scenario_envelope": "MAXIMUM",
            "custom_rainfall_mm": 250.0,
            "custom_scs_cn": 82.0,
            "custom_breach_width_m": 120.0,
            "include_dam_breach": True
        })
        assert res2.status_code == 200, f"Failed POST /api/hydrodynamics/simulate: {res2.text}"
        sim_data = res2.json()
        out = sim_data["hydrodynamic_outputs"]
        print(f"  POST /api/hydrodynamics/simulate -> Combined Q = {out['combined_peak_discharge_m3s']} m3/s | Depth = {out['max_water_depth_m']} m | Area = {out['flood_inundation_area_km2']} km2")
        assert sim_data["status"] == "SUCCESS"
        assert out["combined_peak_discharge_m3s"] > 10000.0

    print("  [PASS] Hydrodynamics REST API endpoints test PASSED")

def run_all_tests():
    print("================================================================")
    print(" FLOODHADR PHASE 8 - NEXT-GEN HYDRODYNAMIC ENGINE TESTS")
    print("================================================================")
    test_hydrodynamic_scenario_envelopes_monotonicity()
    test_custom_input_sensitivity()
    asyncio.run(test_hydrodynamics_rest_api_endpoints())
    print("\n================================================================")
    print(" ALL PHASE 8 HYDRODYNAMIC ENGINE TESTS PASSED SUCCESSFULLY! [OK]")
    print("================================================================")

if __name__ == "__main__":
    run_all_tests()
