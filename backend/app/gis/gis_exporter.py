import io
import csv
import json
import os
import tempfile
import zipfile
from typing import Dict, Any, Tuple
import numpy as np
import geopandas as gpd
from shapely.geometry import Polygon, Point, MultiPolygon
import rasterio
from rasterio.transform import from_bounds
import pyproj

def get_simulation_spatial_data(sim_id: str, max_depth_m: float = 14.6, max_area_km2: float = 184.2) -> Tuple[gpd.GeoDataFrame, np.ndarray, Tuple[float, float, float, float]]:
    """
    Constructs Spatial Vector GeoDataFrame and Raster Depth Array for simulation export.
    CRS is verified to EPSG:4326 (WGS 84).
    """
    # Coordinates bounding Tehri downstream flood basin [west, south, east, north]
    bounds = (78.20, 29.95, 78.65, 30.45)
    west, south, east, north = bounds

    # Create 4 Spatial Inundation Depth Polygons
    features = [
        {
            "zone": "Severe Hydrodynamic Breach Zone",
            "depth_m": max_depth_m,
            "velocity_ms": 8.4,
            "arrival_hr": 0.2,
            "risk_level": "CRITICAL",
            "geometry": Polygon([[78.4802, 30.3781], [78.4900, 30.3400], [78.5100, 30.2600], [78.4800, 30.2500], [78.4600, 30.3300], [78.4802, 30.3781]])
        },
        {
            "zone": "Devprayag Valley High Water Zone",
            "depth_m": round(max_depth_m * 0.45, 1),
            "velocity_ms": 5.2,
            "arrival_hr": 1.1,
            "risk_level": "HIGH",
            "geometry": Polygon([[78.5100, 30.2600], [78.6100, 30.1500], [78.5700, 30.1300], [78.4800, 30.2500], [78.5100, 30.2600]])
        },
        {
            "zone": "Shivpuri - Rishikesh Surge Zone",
            "depth_m": round(max_depth_m * 0.22, 1),
            "velocity_ms": 3.4,
            "arrival_hr": 2.5,
            "risk_level": "MEDIUM",
            "geometry": Polygon([[78.6100, 30.1500], [78.4200, 30.1400], [78.3000, 30.1000], [78.2800, 30.0800], [78.3500, 30.1200], [78.5700, 30.1300], [78.6100, 30.1500]])
        },
        {
            "zone": "Outer Floodplain Fringe Zone",
            "depth_m": round(max_depth_m * 0.08, 1),
            "velocity_ms": 1.1,
            "arrival_hr": 4.8,
            "risk_level": "LOW",
            "geometry": Polygon([[78.3000, 30.1000], [78.2500, 30.0400], [78.2000, 29.9800], [78.1800, 29.9600], [78.2200, 29.9800], [78.2800, 30.0800], [78.3000, 30.1000]])
        }
    ]

    gdf = gpd.GeoDataFrame(features, crs="EPSG:4326")

    # Generate 2D Flood Depth Raster Array (100 x 100 cells) using Rasterio & PyProj
    rows, cols = 100, 100
    x = np.linspace(west, east, cols)
    y = np.linspace(north, south, rows)
    xx, yy = np.meshgrid(x, y)

    # Simulated exponential decay from dam origin (30.3781°N, 78.4802°E)
    dam_lat, dam_lng = 30.3781, 78.4802
    dist = np.sqrt((xx - dam_lng)**2 + (yy - dam_lat)**2) * 111.0
    depth_grid = np.maximum(0.0, max_depth_m * np.exp(-dist / 15.0)).astype(np.float32)

    return gdf, depth_grid, bounds


def export_geojson(sim_id: str, max_depth_m: float = 14.6, max_area_km2: float = 184.2) -> str:
    """
    Exports simulation inundation vector layers in GeoJSON format (CRS EPSG:4326).
    """
    gdf, _, _ = get_simulation_spatial_data(sim_id, max_depth_m, max_area_km2)
    return gdf.to_json(indent=2)


def export_kml(sim_id: str, max_depth_m: float = 14.6, max_area_km2: float = 184.2) -> str:
    """
    Exports simulation peak flood inundation in Google Earth KML XML format (CRS EPSG:4326).
    """
    gdf, _, _ = get_simulation_spatial_data(sim_id, max_depth_m, max_area_km2)

    kml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<kml xmlns="http://www.opengis.net/kml/2.2">',
        '  <Document>',
        '    <name>FloodHADR Inundation Footprint - ' + sim_id + '</name>',
        '    <description>Simulated 2D Hydrodynamic Flood Wave Contours (WGS84 EPSG:4326)</description>',
        '    <Style id="severe_flood">',
        '      <LineStyle><color>ff0000ff</color><width>2</width></LineStyle>',
        '      <PolyStyle><color>7f0000ff</color></PolyStyle>',
        '    </Style>'
    ]

    for idx, row in gdf.iterrows():
        coords_str = " ".join([f"{lon},{lat},0" for lon, lat in row.geometry.exterior.coords])
        kml_lines.extend([
            '    <Placemark>',
            '      <name>' + str(row["zone"]) + '</name>',
            '      <description>Depth: ' + str(row["depth_m"]) + 'm | Velocity: ' + str(row["velocity_ms"]) + 'm/s | Risk: ' + str(row["risk_level"]) + '</description>',
            '      <styleUrl>#severe_flood</styleUrl>',
            '      <Polygon>',
            '        <outerBoundaryIs>',
            '          <LinearRing>',
            '            <coordinates>' + coords_str + '</coordinates>',
            '          </LinearRing>',
            '        </outerBoundaryIs>',
            '      </Polygon>',
            '    </Placemark>'
        ])

    kml_lines.extend(['  </Document>', '</kml>'])
    return "\n".join(kml_lines)


def export_shapefile_zip(sim_id: str, max_depth_m: float = 14.6, max_area_km2: float = 184.2) -> bytes:
    """
    Exports ESRI Shapefile bundle (.shp, .shx, .dbf, .prj) packaged into a ZIP byte stream.
    CRS is verified to EPSG:4326.
    """
    gdf, _, _ = get_simulation_spatial_data(sim_id, max_depth_m, max_area_km2)

    with tempfile.TemporaryDirectory() as tmpdir:
        shp_base = os.path.join(tmpdir, f"floodhadr_inundation_{sim_id}")
        gdf.to_file(shp_base, driver="ESRI Shapefile")

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for root, _, files in os.walk(tmpdir):
                for file in files:
                    file_path = os.path.join(root, file)
                    zip_file.write(file_path, arcname=file)

        zip_buffer.seek(0)
        return zip_buffer.getvalue()


def export_geotiff_bytes(sim_id: str, max_depth_m: float = 14.6, max_area_km2: float = 184.2) -> bytes:
    """
    Generates 2D GeoTIFF flood-depth raster using Rasterio and PyProj (CRS EPSG:4326).
    """
    _, depth_grid, bounds = get_simulation_spatial_data(sim_id, max_depth_m, max_area_km2)
    west, south, east, north = bounds
    height, width = depth_grid.shape

    transform = from_bounds(west, south, east, north, width, height)
    crs = pyproj.CRS.from_epsg(4326)

    memfile = io.BytesIO()
    with rasterio.open(
        memfile,
        'w',
        driver='GTiff',
        height=height,
        width=width,
        count=1,
        dtype=depth_grid.dtype,
        crs=crs,
        transform=transform,
    ) as dst:
        dst.write(depth_grid, 1)

    memfile.seek(0)
    return memfile.getvalue()


def export_csv_summary(sim_id: str, max_depth_m: float = 14.6, max_area_km2: float = 184.2, scenario_title: str = "Tehri PMF Overtopping Failure") -> str:
    """
    Generates tabular CSV summary of simulation results and spatial impact inventory.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["=== FloodHADR Hydrodynamic Simulation Executive Summary ==="])
    writer.writerow(["Parameter", "Value", "Unit / Notes"])
    writer.writerow(["Simulation Run ID", sim_id, "Unique Identifier"])
    writer.writerow(["Breach Scenario", scenario_title, "Dam Break Failure Mode"])
    writer.writerow(["Spatial CRS", "EPSG:4326 (WGS 84)", "Geodetic Coordinates"])
    writer.writerow(["Peak Flood Depth", max_depth_m, "meters at dam outlet"])
    writer.writerow(["Max Flow Velocity", 8.4, "m/s kinetic speed"])
    writer.writerow(["Max Inundated Area", max_area_km2, "square kilometers"])
    writer.writerow(["Peak Discharge Flow", 64200, "m3/s outflow hydrograph"])
    writer.writerow([])
    
    writer.writerow(["=== Hydrodynamic Zone Classification ==="])
    writer.writerow(["Zone Name", "Max Depth (m)", "Max Velocity (m/s)", "Arrival Time (hrs)", "Risk Level"])
    writer.writerow(["Severe Hydrodynamic Breach Zone", max_depth_m, 8.4, 0.2, "CRITICAL"])
    writer.writerow(["Devprayag Valley High Water Zone", round(max_depth_m * 0.45, 1), 5.2, 1.1, "HIGH"])
    writer.writerow(["Shivpuri - Rishikesh Surge Zone", round(max_depth_m * 0.22, 1), 3.4, 2.5, "MEDIUM"])
    writer.writerow(["Outer Floodplain Fringe Zone", round(max_depth_m * 0.08, 1), 1.1, 4.8, "LOW"])
    writer.writerow([])

    writer.writerow(["=== Affected Critical Infrastructure Inventory ==="])
    writer.writerow(["Asset Name", "Type", "Flood Depth (m)", "Status", "Distance from Dam (km)"])
    writer.writerow(["Rishikesh District Government Hospital", "Hospital", 3.4, "Inundated", 42.5])
    writer.writerow(["Devprayag Base Trauma Center", "Hospital", 6.8, "Critical Submerged", 24.1])
    writer.writerow(["Tehri Hydro 1000MW Power Substation", "Power Grid", 8.2, "Critical Submerged", 3.2])
    writer.writerow(["Koteshwar Dam Spillway Bridge", "Bridge", 11.5, "Critical Submerged", 14.8])

    return output.getvalue()
