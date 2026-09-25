import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8000"

def make_request(method: str, path: str, payload=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8") if payload else None
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            raw_bytes = response.read()
            try:
                body = raw_bytes.decode("utf-8")
                try:
                    json_body = json.loads(body)
                except Exception:
                    json_body = body[:100]
            except Exception:
                json_body = f"Binary Content ({len(raw_bytes)} bytes)"
            return status, json_body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        return e.code, body
    except Exception as e:
        return 500, str(e)

def run_tests():
    print("==================================================")
    print("   RUNNING FLOODHADR API ENDPOINT TEST SUITE     ")
    print("==================================================")

    results = []

    # 1. GET /api/health
    s, res = make_request("GET", "/api/health")
    print(f"1. GET /api/health -> Status: {s}")
    results.append(("GET /api/health", s in [200, 201]))

    # 2. GET /api/study-areas
    s, res = make_request("GET", "/api/study-areas")
    print(f"2. GET /api/study-areas -> Status: {s}")
    results.append(("GET /api/study-areas", s == 200))

    # 3. POST /api/study-areas
    sa_payload = {
        "name": "Hirakud Basin Test Region",
        "state": "Odisha",
        "river": "Mahanadi River",
        "dam_name": "Hirakud Dam",
        "lat": 21.5303,
        "lng": 83.8711,
        "dem_resolution": "30m SRTM",
        "area_km2": 3450.0,
        "elevation_min": 110.0,
        "elevation_max": 650.0,
        "is_default": False
    }
    s, res = make_request("POST", "/api/study-areas", sa_payload)
    print(f"3. POST /api/study-areas -> Status: {s}")
    results.append(("POST /api/study-areas", s in [200, 201]))
    created_sa_id = res.get("id", "sa-hirakud") if isinstance(res, dict) else "sa-tehri"

    # 4. GET /api/dams
    s, res = make_request("GET", "/api/dams")
    print(f"4. GET /api/dams -> Status: {s}")
    results.append(("GET /api/dams", s == 200))

    # 5. POST /api/dams
    dam_payload = {
        "name": "Hirakud Main Dam",
        "river": "Mahanadi River",
        "study_area_id": created_sa_id,
        "height_m": 61.0,
        "crest_length_m": 4800.0,
        "reservoir_volume_mm3": 5896.0,
        "full_reservoir_level_m": 192.0,
        "current_water_level_m": 189.5,
        "dam_type": "Embankment",
        "construction_year": 1957,
        "spillway_capacity_m3s": 42450.0
    }
    s, res = make_request("POST", "/api/dams", dam_payload)
    print(f"5. POST /api/dams -> Status: {s}")
    results.append(("POST /api/dams", s in [200, 201]))
    created_dam_id = res.get("id", "dam-tehri") if isinstance(res, dict) else "dam-tehri"

    # 6. GET /api/rivers
    s, res = make_request("GET", "/api/rivers")
    print(f"6. GET /api/rivers -> Status: {s}")
    results.append(("GET /api/rivers", s == 200))

    # 7. POST /api/scenarios
    scen_payload = {
        "title": "Hirakud Gate Failure Test Scenario",
        "dam_id": "dam-tehri", # Default seeded dam
        "failure_mode": "Overtopping",
        "breach_width_m": 250.0,
        "breach_height_m": 45.0,
        "formation_time_hr": 2.0,
        "reservoir_water_level_percent": 95.0,
        "mannings_n": 0.030
    }
    s, res = make_request("POST", "/api/scenarios", scen_payload)
    print(f"7. POST /api/scenarios -> Status: {s}")
    results.append(("POST /api/scenarios", s in [200, 201]))
    created_scen_id = res.get("id", "scen-tehri-overtop") if isinstance(res, dict) else "scen-tehri-overtop"

    # 8. GET /api/scenarios
    s, res = make_request("GET", "/api/scenarios")
    print(f"8. GET /api/scenarios -> Status: {s}")
    results.append(("GET /api/scenarios", s == 200))

    # 9. GET /api/scenarios/{id}
    s, res = make_request("GET", f"/api/scenarios/{created_scen_id}")
    print(f"9. GET /api/scenarios/{created_scen_id} -> Status: {s}")
    results.append((f"GET /api/scenarios/{{id}}", s == 200))

    # 10. POST /api/simulations
    sim_payload = {"scenario_id": created_scen_id}
    s, res = make_request("POST", "/api/simulations", sim_payload)
    print(f"10. POST /api/simulations -> Status: {s}")
    results.append(("POST /api/simulations", s in [200, 201]))
    created_sim_id = res.get("id", "sim-2026-001") if isinstance(res, dict) else "sim-2026-001"

    # 11. GET /api/simulations/{id}
    s, res = make_request("GET", f"/api/simulations/{created_sim_id}")
    print(f"11. GET /api/simulations/{created_sim_id} -> Status: {s}")
    results.append((f"GET /api/simulations/{{id}}", s == 200))

    # 12. GET /api/simulations/{id}/status
    s, res = make_request("GET", f"/api/simulations/{created_sim_id}/status")
    print(f"12. GET /api/simulations/{created_sim_id}/status -> Status: {s}")
    results.append((f"GET /api/simulations/{{id}}/status", s == 200))

    # 13. GET /api/simulations/{id}/results
    s, res = make_request("GET", f"/api/simulations/{created_sim_id}/results")
    print(f"13. GET /api/simulations/{created_sim_id}/results -> Status: {s}")
    results.append((f"GET /api/simulations/{{id}}/results", s == 200))

    # 14. GET /api/simulations/{id}/impact
    s, res = make_request("GET", f"/api/simulations/{created_sim_id}/impact")
    print(f"14. GET /api/simulations/{created_sim_id}/impact -> Status: {s}")
    results.append((f"GET /api/simulations/{{id}}/impact", s == 200))

    # 15. GET /api/simulations/{id}/export/kml
    s, res = make_request("GET", f"/api/simulations/{created_sim_id}/export/kml")
    print(f"15. GET /api/simulations/{created_sim_id}/export/kml -> Status: {s}")
    results.append((f"GET /api/simulations/{{id}}/export/kml", s == 200))

    # 16. GET /api/simulations/{id}/export/shp
    s, res = make_request("GET", f"/api/simulations/{created_sim_id}/export/shp")
    print(f"16. GET /api/simulations/{created_sim_id}/export/shp -> Status: {s}")
    results.append((f"GET /api/simulations/{{id}}/export/shp", s == 200))

    print("==================================================")
    all_passed = all(passed for _, passed in results)
    if all_passed:
        print(" SUCCESS: ALL 16 API ENDPOINTS PASSED VERIFICATION!")
    else:
        print(" FAILED: SOME API ENDPOINTS DID NOT RETURN 200/201")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
