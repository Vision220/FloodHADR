import asyncio
import json
import sys
import numpy as np
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.gis.basin_analyzer import (
    calculate_time_of_concentration_kirpich,
    analyze_dem_elevation_matrix,
    validate_and_reproject_geometry,
    compute_river_hydraulic_parameters,
    get_tehri_basin_intelligence_data
)

async def test_basin_intelligence_async():
    print("==================================================")
    print("  FLOODHADR PHASE 2: BASIN & RIVER NETWORK TEST  ")
    print("==================================================")

    # 1. Test Hydrological Equations & Hydraulic Calculations
    print("\n[1/5] Testing Kirpich Time of Concentration & River Hydraulic Calculations...")
    tc = calculate_time_of_concentration_kirpich(length_m=54000.0, slope_m_m=0.012)
    print(f"  Kirpich Tc for 54.0km reach at 0.012 slope: {tc} hours")
    assert tc > 0, "Time of concentration calculation failed"

    synthetic_dem = np.random.uniform(500.0, 2200.0, size=(50, 50))
    stats = analyze_dem_elevation_matrix(synthetic_dem, cell_size_m=50.0)
    print(f"  DEM Elevation & Slope Analysis: {stats}")
    assert "mean_slope_deg" in stats, "DEM slope analysis failed"

    hydr = compute_river_hydraulic_parameters(length_km=45.0, slope_m_m=0.008, upstream_area_km2=800.0)
    print(f"  Manning River Hydraulic Calculation: Q={hydr['discharge_m3s']} m3/s, V={hydr['velocity_ms']} m/s, d={hydr['depth_m']} m")
    assert hydr["discharge_m3s"] > 0 and hydr["velocity_ms"] > 0, "Hydraulic parameters calculation failed"

    # 2. Test Geometry Validation & CRS Handling (PyProj & Shapely)
    print("\n[2/5] Testing Geometry Validation & CRS Handling (EPSG:4326 -> EPSG:32644)...")
    valid_polygon = {
        "type": "Polygon",
        "coordinates": [[[78.4, 30.3], [78.9, 30.3], [78.9, 30.9], [78.4, 30.9], [78.4, 30.3]]]
    }
    val_res = validate_and_reproject_geometry(valid_polygon, src_crs="EPSG:4326", target_crs="EPSG:32644")
    print(f"  Valid Polygon Projection Result: Valid={val_res['is_valid']}, Area={val_res['area_km2']} km2, Perimeter={val_res['perimeter_km']} km")
    assert val_res["is_valid"] and val_res["area_km2"] > 0, "CRS projection or geometry validation failed"

    # 3. Test Invalid Geometry Detection
    print("\n[3/5] Testing Invalid Geometry Detection...")
    invalid_polygon = {
        "type": "Polygon",
        "coordinates": [[[78.4, 30.3], [78.9, 30.9], [78.9, 30.3], [78.4, 30.9], [78.4, 30.3]]] # Self-intersecting
    }
    val_inv = validate_and_reproject_geometry(invalid_polygon)
    print(f"  Self-Intersecting Polygon Validation: IsValid={val_inv['is_valid']}, Reason={val_inv.get('validity_reason')}")

    # 4. Test Live REST Endpoints via FastAPI ASGI In-Process Client
    print("\n[4/5] Testing FastAPI Basin & River Network REST Endpoints...")
    from app.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        endpoints = [
            "/api/catchments",
            "/api/catchments/cat-bhagirathi-001",
            "/api/subcatchments",
            "/api/subcatchments/subcat-upper-bhagirathi",
            "/api/rivers",
            "/api/rivers/riv-bhagirathi-001",
            "/api/river-branches",
            "/api/river-branches/rb-bhagirathi-mid-reach"
        ]

        for path in endpoints:
            resp = await client.get(path)
            print(f"  GET {path} -> HTTP {resp.status_code} OK")
            assert resp.status_code == 200, f"Endpoint {path} failed with {resp.status_code}"

        # Test POST /api/catchments/calculate
        calc_resp = await client.post(
            "/api/catchments/calculate",
            json={
                "geometry": valid_polygon,
                "src_crs": "EPSG:4326",
                "target_crs": "EPSG:32644",
                "slope_m_m": 0.015
            }
        )
        assert calc_resp.status_code == 200, f"POST /api/catchments/calculate failed: {calc_resp.status_code}"
        calc_data = calc_resp.json()
        print(f"  POST /api/catchments/calculate -> HTTP 200 OK: Area={calc_data['calculated_area_km2']} km2, Tc={calc_data['calculated_time_of_concentration_hr']} hrs")
        assert calc_data["status"] == "SUCCESS", "Catchment calculation failed"

        # Test POST /api/river-branches/compute-hydraulics
        hydr_resp = await client.post(
            "/api/river-branches/compute-hydraulics",
            json={
                "length_km": 54.0,
                "slope_m_m": 0.012,
                "upstream_area_km2": 720.0,
                "elevation_min_m": 840.0,
                "elevation_max_m": 1850.0
            }
        )
        assert hydr_resp.status_code == 200, "POST /api/river-branches/compute-hydraulics failed"
        hydr_data = hydr_resp.json()
        print(f"  POST /api/river-branches/compute-hydraulics -> HTTP 200 OK: Q={hydr_data['computed_discharge_m3s']} m3/s, V={hydr_data['computed_velocity_ms']} m/s")

        # Test POST /api/catchments/calculate with invalid geometry
        inv_resp = await client.post(
            "/api/catchments/calculate",
            json={
                "geometry": {"type": "Polygon", "coordinates": []}
            }
        )
        print(f"  POST /api/catchments/calculate (Invalid Geometry) -> HTTP {inv_resp.status_code} (Expected 422 Unprocessable Entity)")
        assert inv_resp.status_code == 422, "Invalid geometry test failed to return 422"

    # 5. Verifying River Branches & Strahler Stream Orders
    print("\n[5/5] Verifying Strahler Stream Orders & River Branch Inspection Data...")
    branches_data = get_tehri_basin_intelligence_data()["river_branches"]
    stream_orders = [b["stream_order"] for b in branches_data]
    print(f"  Strahler Stream Orders Extracted: {stream_orders}")
    assert 1 in stream_orders and 5 in stream_orders, "Strahler stream orders 1..5 verification failed"

    for b in branches_data:
        assert "length_km" in b, "Missing length_km"
        assert "upstream_area_km2" in b, "Missing upstream_area_km2"
        assert "slope_m_m" in b, "Missing slope_m_m"
        assert "discharge_m3s" in b, "Missing discharge_m3s"
        assert "velocity_ms" in b, "Missing velocity_ms"
        assert "depth_m" in b, "Missing depth_m"
        assert "flow_direction" in b, "Missing flow_direction"
        assert "confluence" in b, "Missing confluence"
        assert "elevation_min_m" in b and "elevation_max_m" in b, "Missing elevation bounds"

    print("\n==================================================")
    print("  ALL PHASE 2 BASIN INTELLIGENCE TESTS PASSED!   ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_basin_intelligence_async())
