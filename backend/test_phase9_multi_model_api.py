import sys
import os
import asyncio
from httpx import AsyncClient, ASGITransport

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.simulation.multi_model_studio import (
    MultiModelStudio,
    DiffusiveWaveModel,
    ShallowWaterModel,
    SPHModel,
    HECRASAdapter,
    Delft3DAdapter,
    DemoANNProvider
)

def test_hydraulic_model_abstraction_registered_solvers():
    print("\n--- 1. Testing HydraulicModel Abstraction & 6 Registered Solvers ---")
    studio = MultiModelStudio()
    models = studio.get_registered_models()
    assert len(models) == 6, f"Expected 6 registered models, got {len(models)}"
    
    for m in models:
        print(f"  [MODEL] {m['model_name']} ({m['model_id']})")
        print(f"    - Type: {m['model_type']}")
        print(f"    - Installed & Active: {m['is_installed_and_tested']}")
        print(f"    - Notice: {m['model_notice']}")
        
        assert "model_id" in m
        assert "model_notice" in m
    print("  [PASS] HydraulicModel abstraction & registered solvers test PASSED")

def test_demo_ann_provider_features_and_outputs():
    print("\n--- 2. Testing DemoANNProvider Features & Outputs ---")
    ann = DemoANNProvider()
    inputs = {
        "rainfall_mm": 180.0,
        "cumulative_rainfall_mm": 220.0,
        "antecedent_rainfall_5day_mm": 50.0,
        "catchment_area_km2": 1240.0,
        "slope_deg": 38.0,
        "scs_cn": 78.0,
        "soil_type": "COLLUVIAL",
        "reservoir_water_level_m": 830.0,
        "main_river_discharge_m3s": 1250.0,
        "tributary_discharge_m3s": 450.0
    }
    
    res = ann.run_model(inputs)
    assert res["results_available"] is True
    assert res["training_status"] == "UNTRAINED / DEMO SURROGATE"
    assert res["model_notice"] == "EXPERIMENTAL / NOT VALIDATED"
    
    feats = res["feature_inputs"]
    outs = res["outputs"]
    
    print(f"  ANN Feature Inputs Verified: Rain={feats['rainfall_mm']}mm, CN={feats['scs_cn']}, Slope={feats['slope_deg']}deg, Reserv={feats['reservoir_level_m']}m")
    print(f"  ANN Surrogate Outputs: Runoff={outs['runoff_depth_mm']}mm | Q_peak={outs['peak_discharge_m3s']}m3/s | Depth={outs['max_water_depth_m']}m | Area={outs['flood_inundation_area_km2']}km2")
    print(f"  ANN Training Notice: '{res['model_notice']}'")
    
    assert outs["peak_discharge_m3s"] > 0
    assert outs["max_water_depth_m"] > 0
    print("  [PASS] DemoANNProvider features & outputs test PASSED")

def test_external_adapters_import_export_decks():
    print("\n--- 3. Testing External Model Adapters (HEC-RAS & Delft3D) ---")
    hec = HECRASAdapter()
    delft = Delft3DAdapter()
    inputs = {"peak_discharge_m3s": 15000.0}

    # HEC-RAS Adapter
    hec_res = hec.run_model(inputs)
    assert hec_res["results_available"] is False
    assert hec_res["metadata"]["is_installed_and_tested"] is False
    assert hec_res["metadata"]["model_notice"] == "ADAPTER IMPORT/EXPORT READY — HEC-RAS ENGINE NOT INSTALLED LOCALLY"
    assert hec_res["export_deck"]["export_status"] == "EXPORT_READY"
    print(f"  HEC-RAS Adapter Deck Generated: {hec_res['export_deck']['geometry_file']} | Notice: '{hec_res['metadata']['model_notice']}'")

    # Delft3D Adapter
    delft_res = delft.run_model(inputs)
    assert delft_res["results_available"] is False
    assert delft_res["metadata"]["is_installed_and_tested"] is False
    assert delft_res["metadata"]["model_notice"] == "ADAPTER IMPORT/EXPORT READY — DELFT3D-FLOW ENGINE NOT INSTALLED LOCALLY"
    assert delft_res["export_deck"]["export_status"] == "EXPORT_READY"
    print(f"  Delft3D Adapter Deck Generated: {delft_res['export_deck']['mdf_file']} | Notice: '{delft_res['metadata']['model_notice']}'")

    print("  [PASS] External model adapters test PASSED")

def test_multi_model_comparison_studio():
    print("\n--- 4. Testing Multi-Model Comparison Studio Engine ---")
    studio = MultiModelStudio()
    inputs = {"peak_discharge_m3s": 12500.0, "rainfall_mm": 180.0, "scs_cn": 78.0}
    
    matrix_res = studio.run_comparison_matrix(inputs)
    assert matrix_res["status"] == "SUCCESS"
    matrix = matrix_res["comparison_matrix"]
    assert len(matrix) == 6
    
    print("  Side-by-Side Model Comparison Matrix Summary:")
    for item in matrix:
        meta = item["metadata"]
        outs = item["outputs"]
        if outs:
            print(f"    * {meta['model_name']} ({meta['model_type']}): Q = {outs['peak_discharge_m3s']} m3/s | h = {outs['max_water_depth_m']} m | Area = {outs['flood_inundation_area_km2']} km2")
        else:
            print(f"    * {meta['model_name']} ({meta['model_type']}): [ADAPTER DECK ONLY - ENGINE NOT INSTALLED LOCALLY]")

    print("  [PASS] Multi-Model Comparison Studio engine test PASSED")

async def test_multi_model_rest_api_endpoints():
    print("\n--- 5. Testing Multi-Model REST API Endpoints ---")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/multi-model/models
        res1 = await client.get("/api/multi-model/models")
        assert res1.status_code == 200, f"Failed GET /api/multi-model/models: {res1.text}"
        models = res1.json()
        print(f"  GET /api/multi-model/models -> Returned {len(models)} registered models")
        
        # POST /api/multi-model/compare
        res2 = await client.post("/api/multi-model/compare", json={"peak_discharge_m3s": 14000.0, "rainfall_mm": 200.0})
        assert res2.status_code == 200, f"Failed POST /api/multi-model/compare: {res2.text}"
        comp = res2.json()
        print(f"  POST /api/multi-model/compare -> Compared {len(comp['comparison_matrix'])} model providers")
        
        # POST /api/multi-model/export-deck (HEC-RAS)
        res3 = await client.post("/api/multi-model/export-deck", json={"model_id": "model-hec-ras", "peak_discharge_m3s": 14000.0})
        assert res3.status_code == 200, f"Failed POST /api/multi-model/export-deck: {res3.text}"
        deck_hec = res3.json()
        print(f"  POST /api/multi-model/export-deck (HEC-RAS) -> Status: {deck_hec['status']} | Notice: '{deck_hec['notice']}'")
        assert deck_hec["notice"] == "ADAPTER IMPORT/EXPORT READY — HEC-RAS ENGINE NOT INSTALLED LOCALLY"

        # POST /api/multi-model/export-deck (Delft3D)
        res4 = await client.post("/api/multi-model/export-deck", json={"model_id": "model-delft3d", "peak_discharge_m3s": 14000.0})
        assert res4.status_code == 200, f"Failed POST /api/multi-model/export-deck: {res4.text}"
        deck_delft = res4.json()
        print(f"  POST /api/multi-model/export-deck (Delft3D) -> Status: {deck_delft['status']} | Notice: '{deck_delft['notice']}'")
        assert deck_delft["notice"] == "ADAPTER IMPORT/EXPORT READY — DELFT3D-FLOW ENGINE NOT INSTALLED LOCALLY"

    print("  [PASS] Multi-Model REST API endpoints test PASSED")

def run_all_tests():
    print("================================================================")
    print(" FLOODHADR PHASE 9 - AI & MULTI-MODEL INTEROPERABILITY TESTS")
    print("================================================================")
    test_hydraulic_model_abstraction_registered_solvers()
    test_demo_ann_provider_features_and_outputs()
    test_external_adapters_import_export_decks()
    test_multi_model_comparison_studio()
    asyncio.run(test_multi_model_rest_api_endpoints())
    print("\n================================================================")
    print(" ALL PHASE 9 MULTI-MODEL TESTS PASSED SUCCESSFULLY! [OK]")
    print("================================================================")

if __name__ == "__main__":
    run_all_tests()
