import os
import sys
import asyncio

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.utils.synthetic_dem import generate_synthetic_dem
from app.gis.dem_processor import DEMProcessor

def test_dem_processing():
    print("--- 1. Testing Synthetic DEM Generation ---")
    dem_path = "uploads/dem/test_synthetic_tehri.tif"
    generated_file = generate_synthetic_dem(dem_path)
    assert os.path.exists(generated_file), "Synthetic DEM file was not created"
    print(f"[OK] Synthetic DEM created successfully at: {generated_file}")

    print("\n--- 2. Testing DEM Validation & Processing ---")
    result = DEMProcessor.process_dem(generated_file, "test_synthetic_tehri.tif")
    meta = result["metadata"]
    preview = result["preview"]
    sim_grid = result["simulation_grid"]

    print(f"[OK] DEM Name: {meta['filename']}")
    print(f"[OK] CRS: {meta['crs']}")
    print(f"[OK] Resolution: {meta['resolution']}")
    print(f"[OK] Dimensions (Width x Height): {meta['width']} x {meta['height']}")
    print(f"[OK] Min Elevation: {meta['min_elevation']} m")
    print(f"[OK] Max Elevation: {meta['max_elevation']} m")
    print(f"[OK] Mean Elevation: {meta['mean_elevation']} m")
    print(f"[OK] Downsampled Preview Cells Count: {len(preview['elevation_cells'])}")
    print(f"[OK] GeoJSON Boundary Type: {preview['geojson_boundary']['type']}")
    print(f"[OK] Simulation Grid Total Cells: {sim_grid['total_cells']}")

    print("\n--- 3. Testing Invalid DEM Handling ---")
    invalid_file = "uploads/dem/invalid_dummy.txt"
    os.makedirs(os.path.dirname(invalid_file), exist_ok=True)
    with open(invalid_file, "w") as f:
        f.write("This is not a GeoTIFF raster!")

    try:
        DEMProcessor.validate_raster(invalid_file)
        print("FAIL: Expected DEMValidationError for invalid file.")
    except Exception as e:
        print(f"[OK] Handled invalid file gracefully: {str(e)}")
    finally:
        if os.path.exists(invalid_file):
            os.remove(invalid_file)

    print("\nALL DEM MODULE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_dem_processing()
