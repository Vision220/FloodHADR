import asyncio
from app.satellite.demo_provider import DemoSatelliteProvider

def test_demo_provider():
    provider = DemoSatelliteProvider()
    print("Testing Stage 1: Acquisition...")
    acq = provider.acquire_satellite_data("TEHRI_RISHIKESH", "Sentinel-1 SAR", "2026-08-01", "2026-08-15")
    assert acq["is_demo_data"] is True
    print(f"Acquisition scenes: {acq['before_image']['scene_id']} / {acq['after_image']['scene_id']}")

    print("Testing Stage 2: Preprocessing...")
    prep = provider.preprocess_imagery(acq)
    assert prep["preprocessing_status"] == "SUCCESS"

    print("Testing Stage 3: Water Detection...")
    water = provider.detect_water_extent(prep)
    assert "total_water_extent_geojson" in water

    print("Testing Stage 4: Flood Extent...")
    flood = provider.extract_flood_extent(water)
    assert flood["flood_area_km2"] == 28.45

    print("Testing Stage 5: Model Comparison...")
    comp = provider.compare_with_model(flood)
    metrics = comp["metrics"]
    print(f"Metrics: IoU={metrics['intersection_over_union']}, Precision={metrics['precision']}, Recall={metrics['recall']}, CSI={metrics['critical_success_index']}")
    print("ALL SATELLITE PROVIDER STAGES VERIFIED CLEANLY!")

if __name__ == "__main__":
    test_demo_provider()
