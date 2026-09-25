import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app
from app.utils.synthetic_dem import generate_synthetic_dem

client = TestClient(app)

def test_dem_api_endpoints():
    print("--- 1. Testing GET default DEM metadata & preview ---")
    res_meta = client.get("/api/data/dem/dem-tehri-default/metadata")
    assert res_meta.status_code == 200, f"Expected 200, got {res_meta.status_code}: {res_meta.text}"
    meta = res_meta.json()
    print(f"[OK] Default DEM Metadata Endpoint: Name={meta['filename']}, CRS={meta['crs']}, Res={meta['resolution']}")
    print(f"     Elev Min={meta['min_elevation']}m, Max={meta['max_elevation']}m, Mean={meta['mean_elevation']}m")

    res_prev = client.get("/api/data/dem/dem-tehri-default/preview")
    assert res_prev.status_code == 200, f"Expected 200, got {res_prev.status_code}: {res_prev.text}"
    prev = res_prev.json()
    print(f"[OK] Default DEM Preview Endpoint: Cells={len(prev['elevation_cells'])}, Bounds={prev['bounds']}")

    print("\n--- 2. Testing POST /api/data/dem/upload ---")
    test_dem_file = "uploads/dem/test_upload_tehri.tif"
    generate_synthetic_dem(test_dem_file)

    with open(test_dem_file, "rb") as f:
        response = client.post(
            "/api/data/dem/upload",
            files={"file": ("test_upload_tehri.tif", f, "image/tiff")}
        )
    
    assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}: {response.text}"
    upload_meta = response.json()
    dem_id = upload_meta["id"]
    print(f"[OK] Upload Endpoint: Assigned DEM ID = {dem_id}")
    print(f"     Width x Height = {upload_meta['width']} x {upload_meta['height']}")

    print("\n--- 3. Testing GET uploaded DEM metadata and preview ---")
    res_up_meta = client.get(f"/api/data/dem/{dem_id}/metadata")
    assert res_up_meta.status_code == 200
    assert res_up_meta.json()["filename"] == "test_upload_tehri.tif"

    res_up_prev = client.get(f"/api/data/dem/{dem_id}/preview")
    assert res_up_prev.status_code == 200
    print("[OK] Uploaded DEM endpoints verified successfully.")

    print("\n--- 4. Testing Invalid File Upload Error Handling ---")
    invalid_file = "uploads/dem/dummy_invalid.txt"
    with open(invalid_file, "w") as f:
        f.write("invalid content")
    
    with open(invalid_file, "rb") as f:
        res_inv = client.post(
            "/api/data/dem/upload",
            files={"file": ("dummy_invalid.txt", f, "text/plain")}
        )
    assert res_inv.status_code == 400, f"Expected 400 Bad Request, got {res_inv.status_code}"
    print(f"[OK] Gracefully rejected invalid file upload: {res_inv.json()['detail']}")

    if os.path.exists(invalid_file):
        os.remove(invalid_file)

    print("\nALL DEM ENDPOINT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_dem_api_endpoints()
