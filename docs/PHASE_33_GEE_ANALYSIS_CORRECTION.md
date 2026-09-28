# Phase 33 Documentation: Google Earth Engine Flood Analysis Correction

## Architectural Overview

Phase 33 corrects the Google Earth Engine (GEE) module architecture. GEE serves strictly as a remote sensing observation, rainfall monitoring, land cover context, and flood validation service. **GEE does NOT calculate the main dam-break hydraulic solution** (which is solved exclusively by the FloodHADR 2D SWE/DWE finite-volume solver).

```
                 SATELLITE DATA SOURCES
  ┌───────────────────────┬────────────────────────┐
  │ Sentinel-1 SAR        │ Sentinel-2 Optical     │
  │ (Cloud-Penetrating)   │ (L2A MSI Surface Refl) │
  └───────────┬───────────┴───────────┬────────────┘
              │                       │
              ▼                       ▼
    GEE REMOTE SENSING CATALOG (Google Earth Engine API)
              │
              ├── B. Satellite Observation (Sentinel-1 SAR / Sentinel-2 Optical)
              ├── C. Rainfall Remote Sensing (CHIRPS Daily Precipitation)
              ├── D. Land Cover (ESA WorldCover LULC & NDVI Index)
              └── E. Flood Extent Validation (3-Way Spatial Comparison)
                               │
                               ▼
    3-WAY SPATIAL VALIDATION ENGINE (Spatial IoU & Confusion Matrix)
              ├── 1. GEE Satellite Observed Flood Extent (Sentinel-1 SAR)
              ├── 2. FloodHADR Hydraulic Extent (2D Finite Volume SWE)
              └── 3. HEC-RAS Hydraulic Extent (Reference Run Export)
```

## Explicit Separation of 5 Roles

1. **A. Hydrodynamic Simulation**: Explicitly disabled in GEE. Handled exclusively by the 2D finite-volume SWE/DWE core.
2. **B. Satellite Observation**: Sentinel-1 C-Band SAR GRD microwave backscatter & Sentinel-2 Level-2A surface reflectance optical imagery.
3. **C. Rainfall Remote Sensing**: CHIRPS daily satellite precipitation time-series (`UCSB-CHG/CHIRPS/DAILY`).
4. **D. Land Cover**: ESA WorldCover 10m LULC & Sentinel-2 NDVI vegetation index.
5. **E. Flood Extent Validation**: 3-way spatial comparison and confusion matrix calculation.

## GEE Execution State Standards

The module returns explicit execution states:
- **`LIVE`**: GEE API credentials are authenticated and connected.
- **`DEMO`**: Fallback baseline evaluation mode (unauthenticated).
- **`NOT CONFIGURED`**: GEE credentials or environment variables are missing.
- **`ERROR`**: GEE API request failed.

> **Rule**: The system NEVER displays `"online"` when GEE credentials or services are unavailable.

## Mandatory 7-Field Layer Metadata Schema

Every GEE layer returned contains all 7 metadata fields:
1. `dataset`: e.g. `COPERNICUS/S1_GRD`, `COPERNICUS/S2_SR_HARMONIZED`, `UCSB-CHG/CHIRPS/DAILY`
2. `acquisition_date`: e.g. `2026-07-05`
3. `processing_method`: e.g. `Refined Lee Speckle Filtering & Backscatter Thresholding (-14dB)`
4. `cloud_filtering`: e.g. `None (SAR Radar Microwave All-Weather)` / `QA60 Cloud Bitmask < 20%`
5. `spatial_resolution`: e.g. `10m` / `0.05° (~5.5km)`
6. `source`: e.g. `Google Earth Engine Data Catalog / ESA Copernicus`
7. `provenance`: `OBSERVED`, `DERIVED`, `DEMO`, or `NOT_CONFIGURED`

## 3-Way Spatial Flood Extent Comparison

`GEEFloodService.compare_flood_extent` calculates spatial agreement between:
- GEE Satellite Observed Extent ($A_{\text{gee}}$)
- FloodHADR Hydraulic Extent ($A_{\text{fh}}$)
- HEC-RAS Hydraulic Extent ($A_{\text{hec}}$)

Calculated metrics include:
- `floodhadr_vs_gee_iou`: $\frac{\text{Intersection}(A_{\text{fh}}, A_{\text{gee}})}{\text{Union}(A_{\text{fh}}, A_{\text{gee}})}$
- `hecras_vs_gee_iou`: $\frac{\text{Intersection}(A_{\text{hec}}, A_{\text{gee}})}{\text{Union}(A_{\text{hec}}, A_{\text{gee}})}$
- `floodhadr_vs_hecras_iou`: $\frac{\text{Intersection}(A_{\text{fh}}, A_{\text{hec}})}{\text{Union}(A_{\text{fh}}, A_{\text{hec}})}$
- `false_positive_area_km2`: $A_{\text{fh}} - \text{Intersection}$
- `false_negative_area_km2`: $A_{\text{gee}} - \text{Intersection}$
