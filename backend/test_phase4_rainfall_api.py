import asyncio
import json
import sys
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.rainfall import (
    adjust_cn_for_amc,
    calculate_scs_cn_runoff,
    compute_scs_runoff_hydrograph,
    DemoRainfallProvider,
    HistoricalRainfallProvider,
    ForecastRainfallProvider
)

async def test_rainfall_scs_cn_intelligence_async():
    print("==================================================")
    print("  FLOODHADR PHASE 4: RAINFALL & SCS-CN TEST      ")
    print("==================================================")

    # 1. Test SCS Curve Number Equations against Known Benchmark Test Cases
    print("\n[1/5] Testing SCS-CN Fundamental Equations (S, Ia, Q)...")
    # Benchmark Case 1: CN = 78, P = 180 mm, lambda = 0.20
    scs_1 = calculate_scs_cn_runoff(rainfall_p_mm=180.0, cn_value=78.0, amc="AMC_II", lambda_val=0.20)
    print(f"  CN=78, P=180mm -> Retention S={scs_1['retention_s_mm']}mm, Ia={scs_1['initial_abstraction_ia_mm']}mm, Q={scs_1['runoff_depth_q_mm']}mm")
    
    expected_s = round((25400.0 / 78.0) - 254.0, 2) # 71.64 mm
    expected_ia = round(0.20 * expected_s, 2)       # 14.33 mm
    expected_q = round(((180.0 - expected_ia) ** 2) / ((180.0 - expected_ia) + expected_s), 2) # 115.67 mm

    assert abs(scs_1['retention_s_mm'] - expected_s) < 0.1, "Potential retention S calculation mismatch"
    assert abs(scs_1['initial_abstraction_ia_mm'] - expected_ia) < 0.1, "Initial abstraction Ia calculation mismatch"
    assert abs(scs_1['runoff_depth_q_mm'] - expected_q) < 0.2, "Runoff depth Q calculation mismatch"
    assert "calibration_notice" in scs_1, "Missing model calibration disclaimer"

    # Benchmark Case 2: P <= Ia (No Runoff)
    scs_zero = calculate_scs_cn_runoff(rainfall_p_mm=10.0, cn_value=78.0, amc="AMC_II", lambda_val=0.20)
    print(f"  P=10mm (P <= Ia=14.33mm) -> Runoff Q={scs_zero['runoff_depth_q_mm']}mm (Expected 0.0mm)")
    assert scs_zero['runoff_depth_q_mm'] == 0.0, "Runoff when P <= Ia should be 0.0mm"

    # 2. Test AMC Antecedent Moisture Condition Adjustments
    print("\n[2/5] Testing AMC Moisture Condition CN Adjustments (AMC I, II, III)...")
    cn_normal = 78.0
    cn_dry = adjust_cn_for_amc(cn_normal, "AMC_I")
    cn_wet = adjust_cn_for_amc(cn_normal, "AMC_III")
    print(f"  Base CN_II={cn_normal} -> AMC_I (Dry): {cn_dry}, AMC_III (Wet): {cn_wet}")
    assert cn_dry < cn_normal, "AMC I should reduce Curve Number"
    assert cn_wet > cn_normal, "AMC III should increase Curve Number"

    # 3. Test Provider Architecture (Demo, Historical, Forecast)
    print("\n[3/5] Testing Rainfall Provider Architecture (Polymorphism & Provenance)...")
    demo_p = DemoRainfallProvider()
    hist_p = HistoricalRainfallProvider()
    fcst_p = ForecastRainfallProvider()

    demo_data = demo_p.get_rainfall_series()
    hist_data = hist_p.get_rainfall_series()
    fcst_data = fcst_p.get_rainfall_series()

    print(f"  Demo Provider Status: {demo_p.get_provider_metadata()['quality_status']} ({demo_data['total_rainfall_mm']}mm)")
    print(f"  Historical Provider Status: {hist_p.get_provider_metadata()['quality_status']} ({hist_data['total_rainfall_mm']}mm)")
    print(f"  Forecast Provider Status: {fcst_p.get_provider_metadata()['quality_status']} ({fcst_data['total_rainfall_mm']}mm)")

    assert demo_p.get_provider_metadata()["quality_status"] == "DEMO", "Demo provider metadata status mismatch"
    assert hist_p.get_provider_metadata()["quality_status"] == "OBSERVED", "Historical provider metadata status mismatch"
    assert fcst_p.get_provider_metadata()["quality_status"] == "FORECAST", "Forecast provider metadata status mismatch"

    # 4. Test REST API Endpoints via ASGI Client
    print("\n[4/5] Testing FastAPI REST Endpoints (/api/rainfall, /api/forecast, /api/scs-cn/calculate)...")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # GET /api/rainfall
        rf_resp = await client.get("/api/rainfall?provider_type=DEMO")
        assert rf_resp.status_code == 200, f"GET /api/rainfall failed: {rf_resp.status_code}"
        rf_json = rf_resp.json()
        print(f"  GET /api/rainfall -> HTTP 200 OK ({len(rf_json['rainfall_series'])} steps)")

        # GET /api/forecast
        fc_resp = await client.get("/api/forecast")
        assert fc_resp.status_code == 200, f"GET /api/forecast failed: {fc_resp.status_code}"
        fc_json = fc_resp.json()
        print(f"  GET /api/forecast -> HTTP 200 OK ({fc_json['provider']['quality_status']})")

        # POST /api/scs-cn/calculate
        calc_resp = await client.post(
            "/api/scs-cn/calculate",
            json={
                "rainfall_p_mm": 180.0,
                "cn_value": 78.0,
                "amc": "AMC_II",
                "lambda_val": 0.20,
                "catchment_area_km2": 1240.0,
                "provider_type": "DEMO"
            }
        )
        assert calc_resp.status_code == 200, f"POST /api/scs-cn/calculate failed: {calc_resp.status_code}"
        calc_json = calc_resp.json()
        print(f"  POST /api/scs-cn/calculate -> HTTP 200 OK: Q={calc_json['scs_cn_results']['runoff_depth_q_mm']}mm, V={calc_json['scs_cn_results']['runoff_volume_mm3']} Mm3")
        assert calc_json["status"] == "SUCCESS", "SCS-CN calculation failed"

        # GET /api/scs-cn/cn-matrix
        mat_resp = await client.get("/api/scs-cn/cn-matrix")
        assert mat_resp.status_code == 200, "GET /api/scs-cn/cn-matrix failed"
        print(f"  GET /api/scs-cn/cn-matrix -> HTTP 200 OK ({len(mat_resp.json()['cn_matrix'])} land use types)")

    # 5. Verify Hydrograph Generator Output
    print("\n[5/5] Testing Direct Runoff Hydrograph Generation...")
    hydro_out = compute_scs_runoff_hydrograph(
        rainfall_series=demo_data["rainfall_series"],
        cn_value=78.0,
        amc="AMC_II",
        catchment_area_km2=1240.0,
        time_of_concentration_hr=6.4
    )
    print(f"  Generated Direct Runoff Hydrograph: Peak Discharge Q_peak = {hydro_out['peak_discharge_m3s']} m3/s at t_peak = {hydro_out['time_to_peak_tp_hr']} hrs")
    assert hydro_out["peak_discharge_m3s"] > 0, "Hydrograph peak discharge computation failed"

    print("\n==================================================")
    print("  ALL PHASE 4 RAINFALL & SCS-CN TESTS PASSED!    ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_rainfall_scs_cn_intelligence_async())
