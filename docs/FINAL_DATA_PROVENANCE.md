# FINAL_DATA_PROVENANCE — FLOODHADR DATA LINEAGE & ORIGIN AUDIT

## Overview
This document specifies the authoritative origin, dataset lineage, and provenance rules for every data layer in FloodHADR.

---

## 1. Topography & Elevation Data
- **Dataset**: Bhuvan / NRSC ALOS PALSAR 12.5m High-Resolution DEM
- **Spatial Resolution**: $12.5\text{m}$ native / $25.0\text{m}$ resampled calculation grid ($30 \times 30$ cells)
- **Coordinate System**: EPSG:32644 (UTM Zone 44N) / EPSG:4326 (WGS84)
- **Vertical Datum**: EGM96 Mean Sea Level (m MSL)
- **Provenance Tag**: `REAL_DEM_ALOS_PALSAR_12M`

---

## 2. Hydraulic Simulation Outputs
- **Solvers**: 2D Shallow Water Equations (SWE) & 2D Diffusive Wave Equation (DWE)
- **Governing Equations**:
  $$\frac{\partial h}{\partial t} + \frac{\partial (hu)}{\partial x} + \frac{\partial (hv)}{\partial y} = 0$$
- **Primary Outputs**: Water depth matrix $h(x,y,t)$, Flow velocity matrix $v(x,y,t)$, Flooded mask, Arrival time isochrones.
- **Provenance Tag**: `DERIVED_FROM_HYDRODYNAMIC_MODEL`

---

## 3. Dam & Reservoir Parameters
- **Dam Name**: Tehri High Earth and Rockfill Dam
- **Crest Elevation**: $830.0\text{ m MSL}$
- **Dam Height**: $260.5\text{ m}$
- **Full Reservoir Level (FRL)**: $830.0\text{ m MSL}$
- **Minimum Drawdown Level (MDDL)**: $740.0\text{ m MSL}$
- **Gross Reservoir Storage**: $3,540.0\text{ Mm}^3$ ($3.54\text{ km}^3$)
- **Data Source**: THDC India Ltd Official Technical Manual
- **Provenance Tag**: `REAL_THDC_ENGINEERING_DATA`

---

## 4. Satellite Observations (Google Earth Engine)
- **SAR Dataset**: COPERNICUS/S1_GRD (Sentinel-1 SAR C-Band)
- **Optical Dataset**: COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 MSI)
- **Rainfall Dataset**: UCSB/CHIRPS/DAILY (0.05° resolution)
- **Authentication State**: `LIVE` (when service account key provided) | `DEMO_DATA_MODE` (when unauthenticated)
- **Provenance Tag**: `REAL_SENTINEL1_SAR` (LIVE) / `DEMO_BENCHMARK` (DEMO)

---

## 5. Critical Infrastructure Inventory
- **Assets**: Tehri HADR Emergency Command Center, District Civil Hospital Tehri, Tehri 400kV Substation, Tehri HEP 1000MW Powerhouse, Tehri Suspension Bridge, Koti Nala Highway Crossing, NH-34 Corridor.
- **Spatial Positioning**: Exact Lat/Lng and DEM ground elevation ($z_{\text{elev}}$).
- **Data Source**: Uttarakhand State GIS Database & NHAI Survey
- **Provenance Tag**: `REAL_GIS_INVENTORY` (Verified Assets) / `DEMO` (Synthetic Extensions)
