# FloodHADR — Smart India Hackathon (SIH 2026) Demonstration Guide
**Problem Statement ID**: NTRO PS 26161 — Generalized Dam-Break & Flash-Flood Hydrodynamic Simulation Platform for HADR Operations  
**Project Title**: FloodHADR Decision Support Platform  
**Target Domain**: Civil Engineering, Hydroinformatics, Remote Sensing, & Humanitarian Assistance and Disaster Relief (HADR)  

---

## 1. Problem Statement

India’s extensive hydraulic infrastructure comprises over 5,300 major dams across Himalayan and peninsular river basins. Extreme precipitation events, glacial lake outbursts (GLOF), aging structural embankments, and extreme PMF (Probable Maximum Flood) inflows create catastrophic dam-break and flash-flood risks. 

Emergency responders—including the National Disaster Response Force (NDRF), Indian Armed Forces HADR units, and Civil Administration—face critical operational challenges:
* **Lack of Rapid Inundation Forecasting**: Traditional 3D hydro models require hours on supercomputing clusters, delaying pre-emptive evacuation orders.
* **Format Interoperability Barriers**: Emergency command centers struggle to convert complex numerical output into usable formats for Google Earth, GIS software, and field teams.
* **Isolated Impact Data**: Inundation boundaries are rarely coupled dynamically with critical civil infrastructure (hospitals, power grids, evacuation corridors).
* **Multi-Scale Physics Requirements**: Standard grid solvers fail to capture localized high-velocity breach surge fronts near dam outlets.

---

## 2. Solution Overview

**FloodHADR** is an end-to-end, generalized 2D hydrodynamic simulation and HADR decision-support platform engineered to solve these challenges:

1. **Generalized Modeling Framework**: Ingests custom DEM GeoTIFF rasters and hydrological inputs for any river basin (demonstrated on Tehri Dam/Bhagirathi River, Hirakud Dam/Mahanadi River, Idukki Dam/Periyar River, and Sardar Sarovar Dam/Narmada River).
2. **Fast 2D Hydrodynamic Core**: Employs a cellular automata 2D Diffusive Wave shallow water solver for rapid in-browser simulation.
3. **Automated HADR Spatial Impact Engine**: Overlays 2D inundation depth grids with spatial infrastructure layers to evaluate flooded buildings, road cutoffs, submerged hospitals, power substations, and clear evacuation routes.
4. **5-Format GIS Data Product Export**: Instantly exports verified spatial results into GeoJSON, Google Earth KML, ESRI Shapefile ZIP, GeoTIFF depth rasters, and CSV analytics.
5. **Multi-Engine Hybrid Architecture**: Integrates an **Experimental SPH Particle Demonstrator** for Lagrangian wave front visualization and a **Delft3D Deck Generator** for HPC cluster handoff.
6. **EO Satellite Monitoring Architecture**: Includes a 5-stage Sentinel-1 SAR dynamic backscatter thresholding (Otsu method) and Sentinel-2 optical MNDWI pipeline interface.
7. **Interactive 8-Step Presentation Demo (`[DEMO MODE]`)**: Features a ~5-minute guided presentation tour with Web Speech API audio narration and a **FLOOD SIMULATION COMPLETE** executive summary screen.

---

## 3. System Architecture

```
                                  +-------------------------------------------------------+
                                  |                  PRESENTATION LAYER                   |
                                  |   React 19 + TypeScript + Tailwind CSS + Lucide Icons |
                                  |   Leaflet GIS Command Map + Hydrograph Recharts       |
                                  |   Interactive [DEMO MODE] Guided Presentation Panel   |
                                  +---------------------------+---------------------------+
                                                              | REST API (HTTP / JSON)
                                  +---------------------------v---------------------------+
                                  |                  APPLICATION BACKEND                  |
                                  |     FastAPI (Python 3.13) + Pydantic + Uvicorn        |
                                  |     Async SQLite / SQLAlchemy ORM (PostGIS Ready)     |
                                  +--------+------------------+------------------+--------+
                                           |                  |                  |
                    +----------------------+                  |                  +----------------------+
                    |                                         |                                         |
+-------------------v-------------------+   +-----------------v-----------------+   +-------------------v-------------------+
|      HYDRODYNAMIC ENGINE SUITE        |   |       GIS & HADR IMPACT ENGINE    |   |     SATELLITE & HPC ADAPTERS          |
| • 2D Diffusive Wave Solver            |   | • DEM GeoTIFF Raster Processor    |   | • Sentinel-1 SAR / Sentinel-2 Pipeline|
| • Froehlich Empirical Breach Hydrograph|   | • GeoPandas Spatial Intersection  |   | • SPH Weakly Compressible Particle    |
| • CFL Stability Check (CFL = 0.42)    |   | • 5-Format GIS Exporter (KML, SHP)|   | • Delft3D (.mdf/.bct) Deck Generator  |
+---------------------------------------+   +-----------------------------------+   +---------------------------------------+
```

---

## 4. Technology Stack

* **Frontend Framework**: React 19, TypeScript 6.0, Vite 8.3
* **Styling & Design**: Vanilla Tailwind CSS v3.4 (Slate/Sky/Tehri color palette, dark mode glassmorphism)
* **GIS Map & Charts**: Leaflet 1.9, React-Leaflet 5.0, Recharts 3.10
* **Backend API**: FastAPI 0.115, Uvicorn 0.34, Pydantic v2
* **Database & ORM**: SQLite (via SQLAlchemy 2.0 Async & AIOSQLite)
* **GIS & Data Libraries**: GeoPandas, Rasterio, Shapely, PyProj, NumPy, SciPy
* **Speech Synthesis**: Browser Web Speech API (`window.speechSynthesis`)

---

## 5. Step-by-Step Demo Workflow (~5 Minutes)

The platform provides a guided 8-step presentation flow accessible via the top-level **`[DEMO MODE]`** button:

```
[STEP 1: Select Study Area]  --> [STEP 2: View Dam & River] --> [STEP 3: Configure Dam Break]
             |                                                                |
[STEP 6: View Impact Analysis] <-- [STEP 5: View Inundation] <-- [STEP 4: Run Simulation]
             |
[STEP 7: Compare Scenarios]  --> [STEP 8: Export Results]  --> [FLOOD SIMULATION COMPLETE]
```

1. **STEP 1: Select Study Area**: Selects Tehri River Basin (Uttarakhand) and loads ALOS PALSAR 50m DEM elevation grid covering 1,240 km² (280m – 2,600m MSL).
2. **STEP 2: View Dam and River**: Displays Tehri Earth & Rockfill Dam specs (Height: 260.5m, Crest: 575m, Reservoir: 3,540 MMm³) and Bhagirathi River hydrology.
3. **STEP 3: Configure Dam Break**: Parameterizes Overtopping & Piping failure mode (120m breach width, 1.5h formation time, 48,500 m³/s peak outflow hydrograph).
4. **STEP 4: Run Simulation**: Executes the 2D Diffusive Wave hydro core across 72 timesteps (12.0 hours) with CFL stability check (CFL = 0.42).
5. **STEP 5: View Flood Inundation**: Visualizes spatial inundation extent (Max Depth: 14.8m, Max Velocity: 7.4 m/s, Area: 28.6 km²) with interactive time scrubbing.
6. **STEP 6: View Impact Analysis**: Evaluates HADR damage (1,420 affected buildings, 84.5 km flooded roads, 12 submerged critical assets, and evacuation routes).
7. **STEP 7: Compare Scenarios**: Cross-compares PMF Overtopping Breach vs Controlled Release (Spatial IoU: 84.2%, peak discharge reduction: 74.8%).
8. **STEP 8: Export Results**: Generates 5 GIS export packages and launches the **FLOOD SIMULATION COMPLETE** final summary screen.

---

## 6. Simulation Methodology & Hydrodynamics

### A. Breach Peak Outflow Hydrograph (Froehlich Formula)
The peak outflow discharge $Q_p$ ($m^3/s$) resulting from dynamic breach enlargement is computed using the Froehlich empirical hydrograph relation:

$$Q_p = 0.607 \cdot V_w^{0.295} \cdot H_b^{1.24}$$

* $V_w$: Impounded reservoir storage volume ($m^3$)
* $H_b$: Height of water above breach invert ($m$)

### B. 2D Shallow Water Diffusion Wave Solver
The 2D Eulerian grid hydrodynamics govern momentum and mass conservation across terrain grid cells $(i, j)$:

$$\frac{\partial h}{\partial t} + \frac{\partial (uh)}{\partial x} + \frac{\partial (vh)}{\partial y} = 0$$

Flow velocities between grid cells are governed by Manning's resistance equation driven by water surface slope $S_f$:

$$u = \frac{1}{n} h^{2/3} S_{fx}^{1/2}, \quad v = \frac{1}{n} h^{2/3} S_{fy}^{1/2}$$

### C. Courant-Friedrichs-Lewy (CFL) Stability Condition
Numerical convergence and stability are maintained by constraining time step delta $t$:

$$CFL = \max\left(\frac{(|u| + \sqrt{gh}) \Delta t}{\Delta x}\right) \le 0.5$$

Current simulation CFL status: **CFL = 0.42 (Stable)**.

---

## 7. GIS Workflow & Coordinate Reference System (CRS)

* **Spatial Reference System**: Standardized on **EPSG:4326 (WGS 84)** for seamless global web GIS compatibility.
* **DEM Processing Pipeline**:
  1. GeoTIFF raster parsing & metadata extraction via Rasterio/GDAL.
  2. Bounding box CRS transform to WGS84 geographic lat/lng.
  3. Matrix downsampling and DEM elevation heatmap grid generation.
  4. Dynamic spatial resolution downscaling (30m / 50m cell sizes).

---

## 8. HADR Impact Analysis & Decision Support

The HADR engine performs spatial polygon overlay operations (using GeoPandas and Shapely) between the 2D flood depth grid and spatial asset layers:

* **Building Inundation**: Calculates submerged residential/commercial structures categorized by risk depth ($<0.5m$ Low, $0.5-1.5m$ Medium, $1.5-3.0m$ High, $>3.0m$ Critical).
* **Transportation Corridors**: Identifies flooded road segments ($km$) and bridge structural submergence.
* **Critical Facilities**: Monitors high-priority assets (hospitals, power substations, water treatment plants).
* **Evacuation Routing**: Evaluates safe versus inundated evacuation routes, assigning assigned evacuee capacity and status (*Clear & Open*, *Caution*, *Blocked*).

---

## 9. SPH Experimental Prototype Module

The platform incorporates an experimental **Smoothed Particle Hydrodynamics (WCSPH)** Lagrangian fluid solver:
* **Physics Kernel**: Quintic spline smoothing kernel $W(r, h)$ for free-surface particle interaction.
* **Use Case**: Demonstrates localized 3D surge wave front dynamics and high-kinetic impact on structures near the dam breach.
* **Disclaimer**: Implemented as an experimental prototype demonstrator for free-surface Lagrangian visualization.

---

## 10. Delft3D External HPC Integration Architecture

For scenarios requiring research-grade 3D shallow water equations, FloodHADR includes a complete **Delft3D-FLOW Deck Generator**:
* **Generated Files**:
  - `tehri_run.mdf`: MDF master control file (grid dimensions, time step, physical parameters).
  - `tehri_valley.dep`: Bathymetry elevation matrix.
  - `tehri_breach.bct`: Time-series boundary conditions for breach hydrograph.
  - `tehri_spillway.src`: Discharge source locations.
* **Execution Handoff**: Automatically prepares valid input decks for external HPC cluster submission when local Delft3D binaries are unconfigured.

---

## 11. Satellite & Google Earth Engine (GEE) Architecture

FloodHADR incorporates a 5-stage Earth Observation (EO) satellite monitoring pipeline architecture:

```
[Stage 1: Acquisition]   --> [Stage 2: Preprocessing] --> [Stage 3: Water Detection]
(Sentinel-1 SAR / S2)        (Speckle & Terrain Correction)   (Otsu Threshold / MNDWI)
                                                                       |
[Stage 5: Model Compare] <-- [Stage 4: Flood Extent]   <---------------+
(IoU, CSI, F1 Score)         (Baseline Water Subtraction)
```

* **Sentinel-1 SAR**: C-Band Synthetic Aperture Radar all-weather cloud-penetrating water detection via Otsu dynamic backscatter thresholding (VV $< -16.2$ dB).
* **Sentinel-2 MSI**: Optical Modified Normalized Difference Water Index (MNDWI) spectral band extraction.
* **GEE Provider Interface**: Modular adapter (`app/satellite/provider_interface.py`) supporting live GEE cloud API execution or local synthetic raster fallbacks.

---

## 12. Multi-Format GIS Data Products

| Format | File Extension | Content Description | Target Software |
| :--- | :--- | :--- | :--- |
| **GeoJSON** | `.geojson` | RFC 7946 vector polygon contours & velocity vectors | Web GIS, Leaflet, Mapbox |
| **KML** | `.kml` | Styled 3D polygon rings & boundary overlays | Google Earth, Marble |
| **Shapefile** | `.zip` | ESRI Shapefile bundle (`.shp`, `.shx`, `.dbf`, `.prj`) | QGIS, ArcGIS Pro, GeoPandas |
| **GeoTIFF** | `.tif` | 32-bit floating point flood depth raster | Rasterio, GDAL, QGIS |
| **CSV Report** | `.csv` | Tabular hydrograph time-series & asset impact list | MS Excel, Pandas, R |
| **HADR Brief** | `.pdf` | Printable executive disaster management brief | Emergency Command Staff |

---

## 13. Known Limitations & Disclaimers

1. **Synthetic Demonstration Data**: All baseline datasets (Tehri DEM grid, river reach, dam specifications, building polygons, road segments, hospitals) are synthetic demonstration layers. They MUST NEVER be represented as actual Indian ground survey observations.
2. **2D Prototype Hydro Solver**: The in-browser 2D hydro engine uses a cellular automata diffusive wave approximation for rapid demonstration. It is not a certified substitute for full Saint-Venant 2D HPC solvers (e.g. Delft3D-FLOW or HEC-RAS 2D).
3. **Delft3D & GEE Adapters**: Delft3D input deck generation and GEE provider interfaces are implemented as architectural adapters; direct execution requires external Delft3D binaries or GEE API credentials.

---

## 14. Future Scope & Roadmap

* **Live GEE API Cloud Connector**: Enable live Sentinel-1 SAR ingestion directly via Google Earth Engine Python API.
* **Delft3D MPI HPC Cluster Runner**: Direct execution wrapper for Delft3D-FLOW binaries on High-Performance Computing (HPC) nodes.
* **Mobile Field Responders App**: React Native offline map reader for NDRF search-and-rescue teams.
* **Real-Time Reservoir Telemetry Ingestion**: Automated CWC (Central Water Commission) reservoir level gauge feed ingestion.
