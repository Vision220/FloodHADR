import sys
import os
import asyncio
from httpx import AsyncClient, ASGITransport

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.gis.landslide_analyzer import (
    get_known_landslide_inventory,
    calculate_landslide_susceptibility
)
from app.gis.landslide_blockage_engine import (
    simulate_landslide_river_blockage
)

def test_landslide_inventory():
    print("\n--- 1. Testing Landslide Inventory ---")
    inventory = get_known_landslide_inventory()
    assert len(inventory) >= 4, f"Expected at least 4 landslide sites, got {len(inventory)}"
    
    for s in inventory:
        print(f"  [SITE] {s['name']} ({s['id']})")
        print(f"    - Location: {s['location_name']} (river km {s['river_km']})")
        print(f"    - Terrain: Slope {s['slope_deg']} deg | Elev {s['elevation_m']} m | Vol {s['estimated_volume_m3']} m3")
        print(f"    - Geology: {s['geology']} | Soil: {s['soil_type']}")
        
        assert "slope_deg" in s
        assert "elevation_m" in s
        assert "geology" in s
        assert "soil_type" in s
    print("  [PASS] Landslide inventory test PASSED")

def test_landslide_susceptibility_index():
    print("\n--- 2. Testing Landslide Susceptibility Index (LSI) ---")
    # Case A: Low risk flat slope
    low_res = calculate_landslide_susceptibility(slope_deg=10.0, elevation_m=400.0, trigger_rainfall_mm=20.0, land_cover="DENSE_FOREST")
    print(f"  Low Risk Case LSI: {low_res['susceptibility_index']} ({low_res['susceptibility_category']})")
    assert low_res["susceptibility_category"] in ["LOW", "MODERATE"]

    # Case B: Steep cloudburst slope
    high_res = calculate_landslide_susceptibility(slope_deg=48.0, elevation_m=2200.0, trigger_rainfall_mm=280.0, geology_type="PHYLLITE_SCHIST", land_cover="BARREN_DEGRADED")
    print(f"  High Risk Case LSI: {high_res['susceptibility_index']} ({high_res['susceptibility_category']})")
    assert high_res["susceptibility_category"] in ["HIGH", "CRITICAL / EXTREME"]

    # Check disclaimer notice
    assert high_res["geotechnical_notice"] == "SIMPLIFIED GEOTECHNICAL SCENARIO — NOT GEOLOGICAL PREDICTION"
    print("  [PASS] Landslide Susceptibility Index (LSI) test PASSED")

def test_river_blockage_scenarios():
    print("\n--- 3. Testing 3 River Blockage Scenarios (NONE, PARTIAL, MAJOR) ---")
    scenarios = ["NONE", "PARTIAL_BLOCKAGE", "MAJOR_BLOCKAGE"]
    
    for sc in scenarios:
        sim = simulate_landslide_river_blockage(
            blockage_scenario=sc,
            landslide_id="ls-koti-nala",
            river_inflow_m3s=1250.0,
            trigger_rainfall_mm=180.0
        )
        assert sim["status"] == "SUCCESS"
        bg = sim["blockage_geometry"]
        up = sim["upstream_ponding"]
        bh = sim["breach_hydrograph"]
        
        print(f"  [SCENARIO: {sc}]")
        print(f"    - Blockage Constriction: {bg['blockage_percentage']}% | Dam Height: {bg['landslide_dam_height_m']} m")
        print(f"    - Upstream Ponding: Vol = {up['ponding_volume_million_m3']} Mm3 | Stage Rise = +{up['water_level_increase_m']} m")
        print(f"    - Breach Surge Peak: {bh['peak_breach_outflow_m3s']} m3/s | Total Q = {bh['total_downstream_peak_q_m3s']} m3/s")
        print(f"    - Downstream Wave Speed: {bh['downstream_wave_velocity_ms']} m/s | Depth = {bh['downstream_surge_depth_m']} m")
        
        # Geotechnical notice check
        assert sim["geotechnical_notice"] == "SIMPLIFIED GEOTECHNICAL SCENARIO — NOT GEOLOGICAL PREDICTION"

    print("  [PASS] River blockage scenarios test PASSED")

async def test_landslide_rest_api_endpoints():
    print("\n--- 4. Testing Landslide REST API Endpoints ---")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/landslides/inventory
        res1 = await client.get("/api/landslides/inventory")
        assert res1.status_code == 200, f"Failed GET /api/landslides/inventory: {res1.text}"
        inv = res1.json()
        print(f"  GET /api/landslides/inventory -> Returned {len(inv)} sites")
        
        # POST /api/landslides/susceptibility
        res2 = await client.post("/api/landslides/susceptibility", json={
            "slope_deg": 42.0,
            "elevation_m": 1600.0,
            "trigger_rainfall_mm": 210.0,
            "soil_type": "COLLUVIAL",
            "geology_type": "PHYLLITE_SCHIST",
            "land_cover": "BARREN_DEGRADED"
        })
        assert res2.status_code == 200, f"Failed POST /api/landslides/susceptibility: {res2.text}"
        lsi_data = res2.json()
        print(f"  POST /api/landslides/susceptibility -> LSI = {lsi_data['susceptibility_index']} ({lsi_data['susceptibility_category']})")
        assert lsi_data["geotechnical_notice"] == "SIMPLIFIED GEOTECHNICAL SCENARIO — NOT GEOLOGICAL PREDICTION"
        
        # POST /api/landslides/blockage-simulate
        res3 = await client.post("/api/landslides/blockage-simulate", json={
            "blockage_scenario": "MAJOR_BLOCKAGE",
            "landslide_id": "ls-koti-nala",
            "river_inflow_m3s": 1500.0,
            "trigger_rainfall_mm": 220.0
        })
        assert res3.status_code == 200, f"Failed POST /api/landslides/blockage-simulate: {res3.text}"
        blockage_data = res3.json()
        print(f"  POST /api/landslides/blockage-simulate -> Breach Peak = {blockage_data['breach_hydrograph']['peak_breach_outflow_m3s']} m3/s")
        print(f"  Geotechnical Notice: '{blockage_data['geotechnical_notice']}'")
        assert blockage_data["geotechnical_notice"] == "SIMPLIFIED GEOTECHNICAL SCENARIO — NOT GEOLOGICAL PREDICTION"

    print("  [PASS] Landslide REST API endpoints test PASSED")

def run_all_tests():
    print("================================================================")
    print(" FLOODHADR PHASE 7 - LANDSLIDE & RIVER BLOCKAGE TESTS")
    print("================================================================")
    test_landslide_inventory()
    test_landslide_susceptibility_index()
    test_river_blockage_scenarios()
    asyncio.run(test_landslide_rest_api_endpoints())
    print("\n================================================================")
    print(" ALL PHASE 7 LANDSLIDE & BLOCKAGE TESTS PASSED SUCCESSFULLY! [OK]")
    print("================================================================")

if __name__ == "__main__":
    run_all_tests()
