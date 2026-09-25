import math
from typing import Dict, Any, Optional, List
import geopandas as gpd
from shapely.geometry import Polygon, MultiPolygon, shape, mapping, box
from shapely.ops import unary_union
from app.satellite.provider_interface import SatelliteProvider

DEMO_NOTICE = (
    "DEMO DATA: Synthetic satellite imagery footprint and water extent. "
    "Generated for prototype demonstration. Not derived from live Google Earth Engine queries."
)

class DemoSatelliteProvider(SatelliteProvider):
    """
    Demo Satellite Provider.
    Generates synthetic but realistic Earth Observation (EO) satellite water detection,
    flood inundation polygons, and spatial model-vs-satellite accuracy comparison matrices.
    """

    def acquire_satellite_data(
        self,
        study_area_id: str,
        satellite_source: str,
        before_date: str,
        after_date: str
    ) -> Dict[str, Any]:
        """Stage 1: Acquisition"""

        satellite_metadata = {
            "Sentinel-1 SAR": {
                "sensor_type": "Synthetic Aperture Radar (C-Band SAR)",
                "mode": "IW (Interferometric Wide Swath)",
                "polarization": "VV + VH",
                "resolution_m": 10.0,
                "pass_direction": "Descending",
                "orbit_number": 14285,
                "cloud_cover_percent": 0.0,  # SAR penetrates cloud cover
            },
            "Sentinel-2 MSI": {
                "sensor_type": "Multi-Spectral Instrument (Optical)",
                "bands": "B3 (Green), B8 (NIR), B11 (SWIR-1)",
                "resolution_m": 10.0,
                "cloud_cover_percent": 12.4,
                "tile_id": "T44RQU",
            },
            "Landsat 8/9 OLI": {
                "sensor_type": "Operational Land Imager (Optical)",
                "bands": "Band 3 (Green), Band 5 (NIR), Band 6 (SWIR-1)",
                "resolution_m": 30.0,
                "cloud_cover_percent": 8.1,
                "path_row": "146/039",
            },
            "PlanetScope": {
                "sensor_type": "High-Res CubeSat Constellation",
                "bands": "RGB + NIR",
                "resolution_m": 3.0,
                "cloud_cover_percent": 3.5,
                "constellation": "Dove-R",
            }
        }.get(satellite_source, {
            "sensor_type": "Earth Observation Satellite",
            "resolution_m": 10.0,
            "cloud_cover_percent": 5.0
        })

        # Bounding box for Tehri - Devprayag - Rishikesh corridor
        bounds = [78.20, 30.05, 78.62, 30.42]

        return {
            "provider_type": "DEMO",
            "is_demo_data": True,
            "notice": DEMO_NOTICE,
            "study_area_id": study_area_id,
            "satellite_source": satellite_source,
            "before_date": before_date,
            "after_date": after_date,
            "bounds": bounds,
            "acquisition_details": satellite_metadata,
            "before_image": {
                "acquisition_time": f"{before_date}T06:12:45Z",
                "scene_id": f"EO_DEMO_{satellite_source.replace(' ', '_')}_BEFORE_{before_date.replace('-', '')}",
                "thumbnail_url": "/assets/satellite_demo_before.jpg",
                "quality_score": 96.5,
            },
            "after_image": {
                "acquisition_time": f"{after_date}T17:34:10Z",
                "scene_id": f"EO_DEMO_{satellite_source.replace(' ', '_')}_AFTER_{after_date.replace('-', '')}",
                "thumbnail_url": "/assets/satellite_demo_after.jpg",
                "quality_score": 94.2,
            }
        }

    def preprocess_imagery(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 2: Preprocessing"""
        satellite_source = raw_data.get("satellite_source", "Sentinel-1 SAR")
        
        is_sar = "SAR" in satellite_source or "Sentinel-1" in satellite_source

        pipeline_steps = [
            {"step": 1, "name": "Orbital State Vector Refinement", "status": "COMPLETED", "detail": "Precise Orbit Ephemerides (POE) applied"},
            {"step": 2, "name": "Thermal Noise Removal", "status": "COMPLETED", "detail": "Radiometric cross-talk attenuation applied"},
            {"step": 3, "name": "Radiometric Calibration", "status": "COMPLETED", "detail": "Gamma-0 (γ°) backscatter calibration in dB"},
            {"step": 4, "name": "Speckle Filtering", "status": "COMPLETED", "detail": "Refined Lee Filter (7x7 window) for granular noise suppression" if is_sar else "Atmospheric correction (Sen2Cor / LaSRC Bottom-of-Atmosphere)"},
            {"step": 5, "name": "Range-Doppler Terrain Correction", "status": "COMPLETED", "detail": "SRTM 30m DEM digital elevation geocoding to EPSG:4326"},
        ]

        return {
            "provider_type": "DEMO",
            "is_demo_data": True,
            "notice": DEMO_NOTICE,
            "satellite_source": satellite_source,
            "preprocessing_status": "SUCCESS",
            "pipeline_steps": pipeline_steps,
            "spatial_crs": "EPSG:4326 (WGS 84)",
            "output_pixel_spacing_m": raw_data.get("acquisition_details", {}).get("resolution_m", 10.0),
        }

    def detect_water_extent(self, preprocessed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 3: Water Detection"""
        satellite_source = preprocessed_data.get("satellite_source", "Sentinel-1 SAR")
        is_sar = "SAR" in satellite_source or "Sentinel-1" in satellite_source

        method_info = {
            "algorithm": "Otsu Dynamic Backscatter Bimodal Thresholding" if is_sar else "MNDWI (Modified Normalized Difference Water Index)",
            "threshold_used": "VV Backscatter < -16.2 dB (Water / Dark Specular Surface)" if is_sar else "MNDWI > 0.22",
            "confidence_level": "92.8%",
        }

        # Baseline permanent river channel (Ganges / Bhagirathi)
        baseline_river_poly = Polygon([
            [78.498, 30.378], [78.495, 30.340], [78.502, 30.280],
            [78.525, 30.200], [78.598, 30.145], [78.420, 30.138],
            [78.325, 30.122], [78.267, 30.086], [78.260, 30.080],
            [78.265, 30.080], [78.272, 30.086], [78.330, 30.122],
            [78.425, 30.138], [78.602, 30.145], [78.508, 30.280],
            [78.500, 30.340], [78.502, 30.378], [78.498, 30.378]
        ])

        # Flooded inundation expansion poly
        flood_expansion_poly = Polygon([
            [78.475, 30.365], [78.505, 30.370], [78.515, 30.285],
            [78.610, 30.150], [78.435, 30.145], [78.395, 30.142],
            [78.275, 30.088], [78.255, 30.070], [78.250, 30.075],
            [78.260, 30.090], [78.380, 30.148], [78.415, 30.150],
            [78.585, 30.155], [78.485, 30.290], [78.470, 30.360],
            [78.475, 30.365]
        ])

        total_water_geom = unary_union([baseline_river_poly, flood_expansion_poly])

        total_water_geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "name": "Satellite Detected Water Surface (Post-Event)",
                        "detection_method": method_info["algorithm"],
                        "is_demo_data": True,
                    },
                    "geometry": mapping(total_water_geom)
                }
            ]
        }

        return {
            "provider_type": "DEMO",
            "is_demo_data": True,
            "notice": DEMO_NOTICE,
            "detection_method": method_info,
            "total_water_extent_geojson": total_water_geojson,
            "total_water_area_km2": 38.65,
            "baseline_water_area_km2": 10.20,
        }

    def extract_flood_extent(self, water_mask: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 4: Flood Extent Extraction"""

        # Dedicated temporary flood polygon (total water minus baseline river)
        flood_polygon = Polygon([
            [78.475, 30.365], [78.490, 30.368], [78.498, 30.285],
            [78.592, 30.148], [78.425, 30.142], [78.385, 30.140],
            [78.272, 30.085], [78.255, 30.075], [78.260, 30.088],
            [78.380, 30.145], [78.418, 30.146], [78.588, 30.152],
            [78.492, 30.288], [78.472, 30.362], [78.475, 30.365]
        ])

        flood_geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "name": "Satellite Extracted Flood Inundation Footprint",
                        "satellite_source": "Sentinel-1 / Sentinel-2 Composite",
                        "area_km2": 28.45,
                        "is_demo_data": True,
                        "notice": DEMO_NOTICE,
                    },
                    "geometry": mapping(flood_polygon)
                }
            ]
        }

        return {
            "provider_type": "DEMO",
            "is_demo_data": True,
            "notice": DEMO_NOTICE,
            "flood_inundation_geojson": flood_geojson,
            "flood_area_km2": 28.45,
            "permanent_water_subtracted_km2": 10.20,
            "flooded_pixels_count": 284500,
        }

    def compare_with_model(
        self,
        satellite_extent: Dict[str, Any],
        model_extent: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Stage 5: Model Comparison"""

        # True Positives (Overlap polygon)
        tp_poly = Polygon([
            [78.478, 30.363], [78.488, 30.365], [78.495, 30.283],
            [78.588, 30.147], [78.422, 30.140], [78.382, 30.138],
            [78.270, 30.083], [78.258, 30.076], [78.262, 30.086],
            [78.378, 30.143], [78.416, 30.144], [78.585, 30.150],
            [78.490, 30.285], [78.475, 30.360], [78.478, 30.363]
        ])

        # False Positives (Satellite detected, Hydro Model did not predict)
        fp_poly = Polygon([
            [78.470, 30.360], [78.475, 30.365], [78.478, 30.363],
            [78.475, 30.360], [78.470, 30.360]
        ])

        # False Negatives (Hydro Model predicted, Satellite missed due to cloud/shadow)
        fn_poly = Polygon([
            [78.592, 30.148], [78.605, 30.150], [78.598, 30.145],
            [78.592, 30.148]
        ])

        comparison_geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "category": "TRUE_POSITIVE",
                        "label": "Spatial Agreement (Model + Satellite)",
                        "description": "Flooding confirmed by both EO Satellite and Hydrodynamic Model",
                        "area_km2": 24.12,
                        "color": "#10B981",  # Emerald Green
                        "is_demo_data": True,
                    },
                    "geometry": mapping(tp_poly)
                },
                {
                    "type": "Feature",
                    "properties": {
                        "category": "FALSE_POSITIVE",
                        "label": "Satellite Only (Model Under-prediction)",
                        "description": "Flooding detected by EO Satellite but missed by Hydrodynamic Model",
                        "area_km2": 4.33,
                        "color": "#F59E0B",  # Amber
                        "is_demo_data": True,
                    },
                    "geometry": mapping(fp_poly)
                },
                {
                    "type": "Feature",
                    "properties": {
                        "category": "FALSE_NEGATIVE",
                        "label": "Model Only (Satellite Under-detection)",
                        "description": "Flooding simulated by Hydrodynamic Model but undetected by Satellite EO",
                        "area_km2": 3.25,
                        "color": "#EF4444",  # Red
                        "is_demo_data": True,
                    },
                    "geometry": mapping(fn_poly)
                },
            ]
        }

        # Calculated spatial validation metrics
        tp_area = 24.12
        fp_area = 4.33
        fn_area = 3.25
        tn_area = 468.30
        total_area = tp_area + fp_area + fn_area + tn_area

        csi = tp_area / (tp_area + fp_area + fn_area)  # Critical Success Index / IoU
        precision = tp_area / (tp_area + fp_area)
        recall = tp_area / (tp_area + fn_area)
        f1_score = 2 * (precision * recall) / (precision + recall)
        accuracy = (tp_area + tn_area) / total_area

        return {
            "provider_type": "DEMO",
            "is_demo_data": True,
            "notice": DEMO_NOTICE,
            "difference_geojson": comparison_geojson,
            "metrics": {
                "satellite_flood_area_km2": 28.45,
                "model_flood_area_km2": 27.37,
                "true_positive_area_km2": tp_area,
                "false_positive_area_km2": fp_area,
                "false_negative_area_km2": fn_area,
                "intersection_over_union": round(csi, 4),
                "critical_success_index": round(csi, 4),
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "f1_score": round(f1_score, 4),
                "spatial_agreement_percent": round(accuracy * 100, 2),
            },
            "confusion_matrix": {
                "true_positive_km2": tp_area,
                "false_positive_km2": fp_area,
                "false_negative_km2": fn_area,
                "true_negative_km2": tn_area,
            }
        }
