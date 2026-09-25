# FloodHADR — Final Smart India Hackathon (SIH 2026) Demonstration Guide

> **Organization**: National Technical Research Organisation (NTRO)  
> **Problem Statement ID**: 26161 — Dam Break Inundation Modelling Using Hydrodynamic Modelling of any River  
> **Theme**: Disaster Management  
> **Project Name**: FloodHADR Decision Support Platform

---

## 1. Executive Summary & SIH Requirements Checklist

FloodHADR is a comprehensive decision support platform built for dam-break inundation modeling, flash-flood propagation, HADR (Humanitarian Assistance & Disaster Relief) spatial impact assessment, interactive 3D twin visualization, and multi-format GIS export products.

### SIH 2026 Verification Matrix:
- [x] **✓ Generalized dam-break modelling framework**: Supports custom DEMs and parameterization for any river basin (Tehri/Bhagirathi, Hirakud/Mahanadi, Bhakra/Sutlej, Sardar Sarovar/Narmada, Idukki/Periyar).
- [x] **✓ Flash-flood scenario generation**: Parameterized breach hydrograph generation using Froehlich empirical equations.
- [x] **✓ DEM input**: GeoTIFF raster parsing, CRS EPSG:4326 transformation, and elevation matrix extraction.
- [x] **✓ Hydrological input architecture**: Discharge hydrographs, reservoir storage volumes, and inflow hydrographs.
- [x] **✓ Satellite data architecture**: 5-stage Sentinel-1 C-band SAR backscatter thresholding (Otsu) and Sentinel-2 optical MNDWI pipeline.
- [x] **✓ Flood inundation mapping**: Dynamic 2D raster heatmap overlays for Depth, Flow Velocity, and Wave Arrival Time.
- [x] **✓ HADR impact analysis**: Automated GeoPandas spatial intersection evaluating affected buildings, flooded roads, submerged hospitals, power substations, and clear evacuation corridors.
- [x] **✓ GUI/dashboard**: Modern glassmorphic NTRO GIS decision support interface with dark mode.
- [x] **✓ Large-data architecture**: Asynchronous SQLite/SQLAlchemy ORM, spatial indexing, and streamed byte generators.
- [x] **✓ SHP output**: Automated ESRI Shapefile ZIP bundle generation (.shp, .shx, .dbf, .prj).
- [x] **✓ KML output**: Styled Google Earth 2.2 XML contours with spatial Placemarks.
- [x] **✓ Scenario comparison**: Side-by-side scenario matrix comparing peak hydrographs and spatial IoU overlap agreement.
- [x] **✓ SPH experimental module**: Lagrangian particle-based dam-break fluid solver demonstrator.
- [x] **✓ Delft3D integration architecture**: Delft3D-FM adapter generating MDF and BCT input decks for external HPC cluster submission.
- [x] **✓ Google Earth Engine integration architecture**: Provider interface for cloud-native satellite data streaming.
- [x] **✓ Indian river/dam demonstration capability**: Pre-loaded baseline datasets for 5 major Indian river basins.

---

## 2. System Architecture & Component Diagram

```
+-----------------------------------------------------------------------------------+
|                                  PRESENTATION LAYER                               |
|   React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons                       |
|   Leaflet GIS Map + Recharts Hydrographs + Three.js / R3F 3D Twin Scene            |
|   Interactive 8-Step [DEMO MODE] Guided Presentation Panel                        |
+------------------------------------------+----------------------------------------+
                                           | REST API
+------------------------------------------v----------------------------------------+
|                                APPLICATION BACKEND                                |
|   FastAPI + Pydantic v2 + SQLite (SQLAlchemy Async ORM)                           |
|   GeoPandas + Rasterio + PyProj + Shapely + NumPy                                 |
+---------+--------------------------------+------------------------------+---------+
          |                                |                              |
+---------v--------------------+ +---------v-------------------+ +--------v-------------------+
| HYDRODYNAMIC ENGINE SUITE    | | GIS & HADR EXPORT ENGINE    | | SATELLITE & HPC ADAPTERS   |
| • 2D Diffusive Wave Solver   | | • DEM Raster Ingestion      | | • Sentinel-1/2 SAR Pipeline|
| • Froehlich Breach Hydrograph| | • GeoJSON, KML, SHP, TIF    | | • SPH Particle Solver    |
| • CFL Stability (CFL = 0.42) | | • Submerged Infrastructure  | | • Delft3D Deck Generator |
+------------------------------+ +-----------------------------+ +----------------------------+
```

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS, Leaflet 1.9, Recharts 3.10, Three.js, `@react-three/fiber` (R3F), `@react-three/drei`.
- **Backend**: Python 3.11/3.13, FastAPI 0.115, Uvicorn 0.34, Pydantic v2, SQLAlchemy 2.0 Async, AIOSQLite.
- **GIS & Analytics**: GeoPandas, Rasterio, Shapely, PyProj, NumPy, SciPy.
- **Containerization**: Multi-stage Dockerfile (Node 22 + Python 3.11-slim + GDAL) and Docker Compose.

---

## 4. 5-Minute Demonstration Flow

1. **Step 1: Select Study Area**: Tehri Dam Basin (Uttarakhand) - ALOS PALSAR 50m DEM grid.
2. **Step 2: View Dam and River**: Tehri Rockfill Dam (260.5m height) & Bhagirathi River reach.
3. **Step 3: Configure Dam Break**: PMF Overtopping failure (120m breach width, $48,500\,\text{m}^3/\text{s}$ peak discharge).
4. **Step 4: Run Simulation**: Executes 2D Diffusive Wave hydro core across 72 timesteps.
5. **Step 5: View Flood Inundation**: Interactive depth, velocity, and wave arrival time layers.
6. **Step 6: View Impact Analysis**: Evaluates submerged buildings, roads, hospitals, substations, and evacuation routes.
7. **Step 7: Compare Scenarios**: Cross-compares Scenario A (Breach) vs Scenario B (Controlled Release) with spatial IoU metrics.
8. **Step 8: Export Results**: Downloads GeoJSON, KML, SHP ZIP, GeoTIFF, and CSV formats, launching the **FLOOD SIMULATION COMPLETE** summary modal.

---

## 5. Hydrodynamic Modeling & Spatial Methodology

- **Breach Outflow Formula**: $Q_p = 0.607 \cdot V_w^{0.295} \cdot H_b^{1.24}$ (Froehlich).
- **2D Diffusion Wave Equations**: $\frac{\partial h}{\partial t} + \frac{\partial (uh)}{\partial x} + \frac{\partial (vh)}{\partial y} = 0$, $u = \frac{1}{n} h^{2/3} S_{fx}^{1/2}$.
- **CFL Stability**: $\text{CFL} = 0.42 \le 0.5$ (Stable).
- **CRS Standard**: EPSG:4326 (WGS84).

---

## 6. Official Demonstration Disclaimers

> [!IMPORTANT]
> **DEMO DATA NOTICE**: All datasets in this demo package (DEM grid, river reaches, dam specifications, building polygons, road segments, hospitals) are synthetic demonstration layers. They MUST NEVER be represented as actual Indian ground survey observations.
