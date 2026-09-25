import os
import math
import numpy as np
import rasterio
from rasterio.enums import Resampling
from pyproj import CRS, Transformer
import geopandas as gpd
from shapely.geometry import box, Polygon, Point
from typing import Dict, Any, List, Tuple

class DEMValidationError(Exception):
    """Custom exception raised when DEM validation fails."""
    pass

class DEMProcessor:
    """
    Geospatial DEM processing engine using Rasterio, NumPy, PyProj, and GeoPandas.
    Non-destructively inspects, validates, downsamples, and converts DEM rasters into 
    hydrodynamic simulation grids and frontend map previews.
    """

    @staticmethod
    def validate_raster(filepath: str) -> Tuple[rasterio.DatasetReader, Dict[str, Any]]:
        """
        Validates the DEM raster file format, readable bands, non-zero dimensions, and CRS.
        Does NOT modify the original file.
        """
        if not os.path.exists(filepath):
            raise DEMValidationError(f"File not found: {filepath}")
        
        try:
            src = rasterio.open(filepath)
        except Exception as e:
            raise DEMValidationError(f"Invalid raster file or unreadable GeoTIFF format: {str(e)}")

        if src.count < 1:
            src.close()
            raise DEMValidationError("Raster does not contain any elevation bands.")

        if src.width <= 0 or src.height <= 0:
            src.close()
            raise DEMValidationError(f"Invalid raster dimensions: {src.width}x{src.height}.")

        # Check CRS presence
        if not src.crs:
            crs_str = "EPSG:4326 (Assumed Default)"
        else:
            try:
                pyproj_crs = CRS.from_user_input(src.crs.to_string())
                crs_str = f"{pyproj_crs.name} ({pyproj_crs.to_authority() or pyproj_crs.to_string()})"
            except Exception:
                crs_str = str(src.crs)

        validation_info = {
            "is_valid": True,
            "driver": src.driver,
            "count": src.count,
            "width": src.width,
            "height": src.height,
            "crs": crs_str,
            "bounds": [src.bounds.left, src.bounds.bottom, src.bounds.right, src.bounds.top],
            "transform": [src.transform.a, src.transform.b, src.transform.c, src.transform.d, src.transform.e, src.transform.f],
        }

        return src, validation_info

    @staticmethod
    def read_elevation_values(src: rasterio.DatasetReader) -> Tuple[np.ndarray, float]:
        """
        Reads elevation values from Band 1 as a NumPy array.
        Identifies and handles Nodata values gracefully.
        """
        band1 = src.read(1).astype(np.float64)
        nodata = src.nodata

        if nodata is not None:
            band1[band1 == nodata] = np.nan
        
        # Replace extreme negative values (common nodata markers like -9999, -32768)
        band1[band1 < -9000] = np.nan
        
        return band1, nodata

    @staticmethod
    def compute_stats(elevation_matrix: np.ndarray) -> Dict[str, float]:
        """
        Determines terrain statistics: min elevation, max elevation, mean elevation, std elevation.
        """
        valid_elev = elevation_matrix[~np.isnan(elevation_matrix)]
        
        if len(valid_elev) == 0:
            return {
                "min_elevation": 0.0,
                "max_elevation": 0.0,
                "mean_elevation": 0.0,
                "std_elevation": 0.0,
            }

        return {
            "min_elevation": float(np.nanmin(valid_elev)),
            "max_elevation": float(np.nanmax(valid_elev)),
            "mean_elevation": float(np.nanmean(valid_elev)),
            "std_elevation": float(np.nanstd(valid_elev)),
        }

    @staticmethod
    def extract_resolution(src: rasterio.DatasetReader) -> Dict[str, Any]:
        """
        Extracts spatial resolution (cell size) in X and Y directions.
        """
        transform = src.transform
        dx = abs(transform.a)
        dy = abs(transform.e)

        # Estimate meter resolution if unit is in degrees (EPSG:4326)
        if src.crs and src.crs.is_geographic:
            # ~111,320 meters per degree latitude at equator
            cell_size_m = round(((dx + dy) / 2.0) * 111320.0, 2)
            res_str = f"{dx:.5f}° × {dy:.5f}° (~{cell_size_m}m)"
        else:
            res_str = f"{dx:.2f}m × {dy:.2f}m"

        return {
            "pixel_size_x": dx,
            "pixel_size_y": dy,
            "resolution_str": res_str,
            "approx_meters": round(((dx + dy) / 2.0) * (111320.0 if (src.crs and src.crs.is_geographic) else 1.0), 1),
        }

    @staticmethod
    def generate_terrain_statistics(elevation_matrix: np.ndarray) -> Dict[str, Any]:
        """
        Generates terrain histogram distribution and slope percentage metrics.
        """
        valid_elev = elevation_matrix[~np.isnan(elevation_matrix)]
        if len(valid_elev) == 0:
            return {"histogram": [], "slope_avg_deg": 0.0}

        counts, bin_edges = np.histogram(valid_elev, bins=6)
        histogram = []
        for i in range(len(counts)):
            histogram.append({
                "range": f"{bin_edges[i]:.0f}m - {bin_edges[i+1]:.0f}m",
                "count": int(counts[i]),
                "min": float(bin_edges[i]),
                "max": float(bin_edges[i+1])
            })

        # Calculate approximate slope gradient using NumPy gradient
        gy, gx = np.gradient(elevation_matrix)
        slope_rad = np.arctan(np.sqrt(gx**2 + gy**2))
        slope_deg = np.degrees(slope_rad)
        avg_slope = float(np.nanmean(slope_deg))

        return {
            "elevation_histogram": histogram,
            "average_slope_deg": round(avg_slope, 2),
            "flat_area_percent": round(float(np.sum(slope_deg < 5.0) / slope_deg.size * 100), 1),
            "steep_area_percent": round(float(np.sum(slope_deg >= 25.0) / slope_deg.size * 100), 1),
        }

    @staticmethod
    def generate_downsampled_preview(src: rasterio.DatasetReader, elevation_matrix: np.ndarray, target_grid_size: int = 40) -> Dict[str, Any]:
        """
        Generates a downsampled elevation matrix and GeoJSON grid preview for map display.
        Handles coordinate transformation into EPSG:4326 (WGS84 Lat/Lng) using PyProj.
        """
        height, width = elevation_matrix.shape

        # Downsample step size
        step_y = max(1, height // target_grid_size)
        step_x = max(1, width // target_grid_size)

        downsampled_elev = elevation_matrix[::step_y, ::step_x]
        ds_h, ds_w = downsampled_elev.shape

        # Reproject bounds to EPSG:4326 using PyProj if needed
        native_crs = src.crs or "EPSG:4326"
        transformer = None
        if native_crs and str(native_crs).upper() != "EPSG:4326":
            try:
                transformer = Transformer.from_crs(native_crs, "EPSG:4326", always_xy=True)
            except Exception:
                transformer = None

        bounds = src.bounds
        if transformer:
            lon_min, lat_min = transformer.transform(bounds.left, bounds.bottom)
            lon_max, lat_max = transformer.transform(bounds.right, bounds.top)
        else:
            lon_min, lat_min, lon_max, lat_max = bounds.left, bounds.bottom, bounds.right, bounds.top

        # Build cells for heat grid preview
        cells = []
        lons = np.linspace(lon_min, lon_max, ds_w)
        lats = np.linspace(lat_max, lat_min, ds_h) # Top down

        min_val = float(np.nanmin(downsampled_elev))
        max_val = float(np.nanmax(downsampled_elev))
        val_range = max(1.0, max_val - min_val)

        for r in range(ds_h):
            for c in range(ds_w):
                z = downsampled_elev[r, c]
                if np.isnan(z):
                    continue
                normalized_z = (z - min_val) / val_range
                cells.append({
                    "lat": float(lats[r]),
                    "lng": float(lons[c]),
                    "elevation": round(float(z), 2),
                    "normalized": round(float(normalized_z), 3)
                })

        # Generate GeoJSON bounding polygon using GeoPandas / Shapely
        poly = box(lon_min, lat_min, lon_max, lat_max)
        gdf = gpd.GeoDataFrame({"geometry": [poly], "name": ["DEM Coverage Boundary"]}, crs="EPSG:4326")
        geojson_bounds = gdf.__geo_interface__

        return {
            "bounds": [[lat_min, lon_min], [lat_max, lon_max]],
            "center": [(lat_min + lat_max) / 2.0, (lon_min + lon_max) / 2.0],
            "downsampled_rows": ds_h,
            "downsampled_cols": ds_w,
            "elevation_cells": cells,
            "geojson_boundary": geojson_bounds,
        }

    @staticmethod
    def convert_to_simulation_grid(src: rasterio.DatasetReader, elevation_matrix: np.ndarray, max_sim_cells: int = 100) -> Dict[str, Any]:
        """
        Converts raw DEM information into a structured 2D simulation grid 
        ready for 2D hydrodynamic flood solver calculations.
        """
        h, w = elevation_matrix.shape
        scale_factor = max(1, max(h, w) // max_sim_cells)

        grid_h = h // scale_factor
        grid_w = w // scale_factor

        # Resample elevation matrix using NumPy slicing / mean aggregation
        reshaped = elevation_matrix[:grid_h * scale_factor, :grid_w * scale_factor]
        sim_elev = reshaped.reshape(grid_h, scale_factor, grid_w, scale_factor).mean(axis=(1, 3))
        sim_elev = np.nan_to_num(sim_elev, nan=float(np.nanmin(elevation_matrix)))

        res_info = DEMProcessor.extract_resolution(src)
        dx_m = res_info["approx_meters"] * scale_factor
        dy_m = dx_m

        return {
            "rows": grid_h,
            "cols": grid_w,
            "cell_size_x_m": round(dx_m, 2),
            "cell_size_y_m": round(dy_m, 2),
            "total_cells": grid_h * grid_w,
            "origin_x": src.bounds.left,
            "origin_y": src.bounds.bottom,
            "crs": str(src.crs or "EPSG:4326"),
            "elevation_matrix_sample": np.round(sim_elev[:5, :5], 2).tolist(), # Sample slice for verification
        }

    @classmethod
    def process_dem(cls, filepath: str, filename: str) -> Dict[str, Any]:
        """
        Full non-destructive processing pipeline for uploaded GeoTIFF DEM file.
        """
        src, val_info = cls.validate_raster(filepath)
        try:
            elevation_matrix, nodata = cls.read_elevation_values(src)
            stats = cls.compute_stats(elevation_matrix)
            resolution_info = cls.extract_resolution(src)
            terrain_stats = cls.generate_terrain_statistics(elevation_matrix)
            preview_data = cls.generate_downsampled_preview(src, elevation_matrix)
            sim_grid = cls.convert_to_simulation_grid(src, elevation_matrix)
        finally:
            src.close()

        metadata = {
            "filename": filename,
            "filepath": filepath,
            "crs": val_info["crs"],
            "width": val_info["width"],
            "height": val_info["height"],
            "resolution": resolution_info["resolution_str"],
            "pixel_size_x": resolution_info["pixel_size_x"],
            "pixel_size_y": resolution_info["pixel_size_y"],
            "approx_cell_meters": resolution_info["approx_meters"],
            "min_elevation": stats["min_elevation"],
            "max_elevation": stats["max_elevation"],
            "mean_elevation": stats["mean_elevation"],
            "std_elevation": stats["std_elevation"],
            "terrain_stats": terrain_stats,
            "sim_grid_summary": {
                "rows": sim_grid["rows"],
                "cols": sim_grid["cols"],
                "cell_size_m": sim_grid["cell_size_x_m"],
                "total_cells": sim_grid["total_cells"],
            }
        }

        return {
            "metadata": metadata,
            "preview": preview_data,
            "simulation_grid": sim_grid,
        }
