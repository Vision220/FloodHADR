import asyncio
import json
import sys
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.gis.dam_analyzer import (
    compute_hydrostatic_parameters,
    get_reservoir_condition_presets,
    get_tehri_dam_intelligence_data
)

async def test_dam_reservoir_intelligence_async():
    print("==================================================")
    print("  FLOODHADR PHASE 3: DAM & RESERVOIR ENGINE TEST ")
    print("==================================================")

    # 1. Test Hydrostatic Equations (P = rho * g * h & Force F = 0.5 * rho * g * h^2 * B)
    print("\n[1/4] Testing Hydrostatic Pressure (P = rho*g*h) & Thrust Force Calculations...")
    h_test = 243.4  # meters (Tehri Dam head at 822.4m RL)
    hydro = compute_hydrostatic_parameters(
        water_level_m=822.4,
        foundation_elevation_m=579.0,
        crest_elevation_m=839.5,
        spillway_level_m=815.0,
        crest_length_m=575.0,
        storage_capacity_mm3=3540.0,
        normal_level_m=830.0
    )

    print(f"  Hydraulic Head: {hydro['hydraulic_head_m']} m")
    print(f"  Base Hydrostatic Pressure: {hydro['hydrostatic_pressure_mpa']} MPa ({hydro['hydrostatic_pressure_kpa']} kPa)")
    print(f"  Unit Hydrostatic Thrust: {hydro['force_per_meter_kn_m']} kN/m")
    print(f"  Total Hydrostatic Force: {hydro['total_hydrostatic_force_mn']} MN")
    
    # Assertions for physical formulas
    expected_p_kpa = round((1000.0 * 9.81 * h_test) / 1000.0, 2)
    assert abs(hydro['hydrostatic_pressure_kpa'] - expected_p_kpa) < 1.0, "Hydrostatic pressure calculation mismatch"
    assert hydro['hydraulic_head_m'] > 0, "Hydraulic head calculation failed"
    assert hydro['total_hydrostatic_force_mn'] > 0, "Hydrostatic force calculation failed"
    assert "disclaimer_notice" in hydro, "Missing scope disclaimer notice"
    print(f"  Disclaimer Notice Verified: '{hydro['disclaimer_notice'][:60]}...'")

    # 2. Test Reservoir Conditions Presets
    print("\n[2/4] Testing 5 Reservoir Conditions Presets (Minimum, Normal, High, Maximum, Extreme)...")
    presets = get_reservoir_condition_presets()
    preset_codes = [p["code"] for p in presets]
    print(f"  Conditions Presets Extracted: {preset_codes}")
    assert len(presets) == 5, "Expected exactly 5 condition presets"
    assert "MOL" in preset_codes and "FRL" in preset_codes and "MWL" in preset_codes and "PMF_OVERTOPPING" in preset_codes, "Preset condition codes missing"

    # 3. Test REST API Endpoints via FastAPI ASGI In-Process Client
    print("\n[3/4] Testing FastAPI Dam & Reservoir REST API Endpoints...")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        endpoints = [
            "/api/dams",
            "/api/dams/dam-tehri-demo",
            "/api/dams/dam-tehri-demo/hydrostatics",
            "/api/reservoirs",
            "/api/reservoirs/res-tehri-001",
            "/api/reservoirs/conditions/presets"
        ]

        for path in endpoints:
            resp = await client.get(path)
            print(f"  GET {path} -> HTTP {resp.status_code} OK")
            assert resp.status_code == 200, f"Endpoint {path} failed with {resp.status_code}"

        # Test POST /api/dams/calculate-hydrostatics
        calc_resp = await client.post(
            "/api/dams/calculate-hydrostatics",
            json={
                "water_level_m": 835.0,
                "foundation_elevation_m": 579.0,
                "crest_elevation_m": 839.5,
                "crest_length_m": 575.0
            }
        )
        assert calc_resp.status_code == 200, f"POST /api/dams/calculate-hydrostatics failed: {calc_resp.status_code}"
        calc_data = calc_resp.json()
        print(f"  POST /api/dams/calculate-hydrostatics -> HTTP 200 OK: Head={calc_data['hydrostatics']['hydraulic_head_m']}m, P={calc_data['hydrostatics']['hydrostatic_pressure_mpa']} MPa")
        assert calc_data["status"] == "SUCCESS", "Hydrostatics calculation endpoint failed"

        # Test POST /api/dams/connect-scenario
        conn_resp = await client.post(
            "/api/dams/connect-scenario",
            json={"condition_id": "cond-extreme"}
        )
        assert conn_resp.status_code == 200, "POST /api/dams/connect-scenario failed"
        conn_data = conn_resp.json()
        print(f"  POST /api/dams/connect-scenario -> HTTP 200 OK: Connected Level={conn_data['connected_scenario_params']['reservoir_water_level_m']}m, Peak Breach Q={conn_data['connected_scenario_params']['calculated_peak_discharge_m3s']} m3/s")
        assert conn_data["status"] == "SUCCESS", "Scenario connection endpoint failed"

    # 4. Verify Dam & Reservoir Parameter Completeness
    print("\n[4/4] Verifying Engineering Parameter Completeness...")
    tehri = get_tehri_dam_intelligence_data()
    d_params = tehri["dam"]
    r_params = tehri["reservoir"]

    dam_req_fields = ["height_m", "crest_elevation_m", "foundation_elevation_m", "crest_length_m", "crest_width_m", "base_width_m", "upstream_slope", "downstream_slope", "dam_type", "material"]
    res_req_fields = ["area_km2", "storage_capacity_mm3", "live_storage_mm3", "dead_storage_mm3", "current_storage_mm3", "current_water_level_m", "minimum_operating_level_m", "normal_reservoir_level_m", "maximum_reservoir_level_m", "spillway_level_m", "inflow_m3s", "outflow_m3s"]

    for field in dam_req_fields:
        assert field in d_params, f"Dam field '{field}' missing"
    for field in res_req_fields:
        assert field in r_params, f"Reservoir field '{field}' missing"

    print(f"  All {len(dam_req_fields)} Dam & {len(res_req_fields)} Reservoir engineering parameters verified!")

    print("\n==================================================")
    print("  ALL PHASE 3 DAM INTELLIGENCE TESTS PASSED!     ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_dam_reservoir_intelligence_async())
