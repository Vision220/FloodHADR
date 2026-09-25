import json
import zipfile
import io
import rasterio
from app.gis.gis_exporter import (
    export_geojson,
    export_kml,
    export_shapefile_zip,
    export_geotiff_bytes,
    export_csv_summary,
)

print("Starting GIS Export Functions Verification...")

sim_id = "sim-2026-001"

# 1. GeoJSON Test
print("\n[1/5] Testing GeoJSON Export...")
geojson_str = export_geojson(sim_id, max_depth_m=14.6, max_area_km2=184.2)
geojson_data = json.loads(geojson_str)
assert geojson_data["type"] == "FeatureCollection"
assert len(geojson_data["features"]) == 4
print(f"  SUCCESS: Generated GeoJSON with {len(geojson_data['features'])} inundation features (RFC 7946 WGS84)")

# 2. KML Test
print("\n[2/5] Testing Google Earth KML Export...")
kml_str = export_kml(sim_id, max_depth_m=14.6, max_area_km2=184.2)
assert "<?xml" in kml_str
assert "<kml" in kml_str
assert "<Polygon>" in kml_str
assert "78.4802,30.3781" in kml_str
print("  SUCCESS: Generated valid Google Earth KML document with outerBoundaryIs coordinates")

# 3. Shapefile ZIP Bundle Test
print("\n[3/5] Testing ESRI Shapefile ZIP Bundle Export...")
zip_bytes = export_shapefile_zip(sim_id, max_depth_m=14.6, max_area_km2=184.2)
zip_file = zipfile.ZipFile(io.BytesIO(zip_bytes))
file_names = zip_file.namelist()
print(f"  Files inside ZIP bundle: {file_names}")
assert any(f.endswith(".shp") for f in file_names)
assert any(f.endswith(".shx") for f in file_names)
assert any(f.endswith(".dbf") for f in file_names)
assert any(f.endswith(".prj") for f in file_names)

# Check .prj file CRS content
prj_content = zip_file.read([f for f in file_names if f.endswith(".prj")][0]).decode()
print(f"  Shapefile PRJ Content: {prj_content[:60]}...")
assert "GEOGCS" in prj_content or "WGS" in prj_content or "4326" in prj_content
print("  SUCCESS: Generated ESRI Shapefile bundle (.shp, .shx, .dbf, .prj) in EPSG:4326")

# 4. GeoTIFF Raster Test
print("\n[4/5] Testing GeoTIFF Flood-Depth Raster Export using Rasterio & PyProj...")
geotiff_bytes = export_geotiff_bytes(sim_id, max_depth_m=14.6, max_area_km2=184.2)
with rasterio.open(io.BytesIO(geotiff_bytes)) as dataset:
    print(f"  Raster Driver: {dataset.driver}")
    print(f"  Dimensions: {dataset.width} x {dataset.height}, Bands: {dataset.count}")
    print(f"  CRS: {dataset.crs}")
    print(f"  Bounds: {dataset.bounds}")
    depth_array = dataset.read(1)
    print(f"  Max Array Depth Value: {depth_array.max():.2f}m")
    assert dataset.driver == 'GTiff'
    assert dataset.crs.to_epsg() == 4326
    assert depth_array.max() > 10.0

print("  SUCCESS: Generated 2D GeoTIFF depth raster in EPSG:4326 with rasterio affine transform")

# 5. CSV Summary Test
print("\n[5/5] Testing CSV Executive Summary Export...")
csv_str = export_csv_summary(sim_id, max_depth_m=14.6, max_area_km2=184.2)
assert "Peak Flood Depth" in csv_str
assert "Severe Hydrodynamic Breach Zone" in csv_str
assert "Rishikesh District Government Hospital" in csv_str
print("  SUCCESS: Generated CSV Summary report with simulation & spatial asset metrics")

print("\nALL 5 GIS EXPORT FORMAT VERIFICATIONS PASSED 100%!")
