# FloodHADR Known Limitations & Architectural Scope

This document details the functional scope, operational boundaries, and system classification of features in **FloodHADR** (Dam-Break & Flash-Flood Simulation Platform for HADR Decision Support).

---

## 1. Implemented Features (Fully Functional)

The following features are fully implemented, tested, and operational:

* **Interactive 8-Step Demonstration Mode (`[DEMO MODE]`)**: Guided presentation tour with auto-play timers, speed controls (1x, 1.5x, 2x), Web Speech API audio narration, step indicator badges, and the **FLOOD SIMULATION COMPLETE** summary modal.
* **RESTful API Backend**: FastAPI service with SQLite/SQLAlchemy async ORM for managing study areas, dam specifications, river reaches, scenarios, simulation runs, and HADR impact assessments.
* **Multi-Format GIS Export Engine**: Automated generation of 5 spatial data product formats:
  - **GeoJSON**: RFC 7946 vector FeatureCollections (EPSG:4326 WGS84).
  - **KML**: Google Earth 2.2 XML document contours.
  - **ESRI Shapefile Bundle**: ZIP archive containing `.shp`, `.shx`, `.dbf`, and `.prj`.
  - **GeoTIFF Depth Raster**: 32-bit floating point flood depth raster generated via Rasterio & PyProj.
  - **CSV Analytics Report**: Tabular hydrograph time-series and submerged asset lists.
* **HADR Spatial Impact Analysis**: Automated intersection of flood extent polygons with GIS infrastructure layers (buildings, roads, hospitals, power substations, bridges, schools, and evacuation routes).
* **Multi-Scenario Comparison**: Comparative matrix plotting peak outflow hydrographs, inundation area reduction, and spatial Intersection-over-Union (IoU) overlap agreement metrics.
* **Synthetic Tehri Baseline Dataset**: Seeded demonstration package containing ALOS PALSAR 50m DEM grid, Tehri Earth & Rockfill Dam specs, Bhagirathi River reach, and downstream infrastructure layers.

---

## 2. Prototype Features

The following components function as fast in-browser demonstrators designed for decision support visualization:

* **2D Diffusive Wave Hydrodynamic Engine**: Uses a cellular automata finite-volume approximation to model shallow water flood wave spreading.
  - *Limitation*: Designed for real-time interactive demonstration. Does not replace full Saint-Venant 2D momentum solvers.
* **Empirical Breach Hydrograph Calculation**: Uses Froehlich empirical breach equations to compute peak discharge $Q_p = 0.607 \cdot V_w^{0.295} \cdot H_b^{1.24}$ and formation hydrographs.
  - *Limitation*: Assumes idealized trapezoidal breach geometry without dynamic sediment transport modeling.

---

## 3. Experimental Features

* **SPH Particle-Based Dam-Break Demonstrator**: A 2D Smoothed Particle Hydrodynamics (WCSPH) Lagrangian solver displaying free-surface fluid particle animation frames and pressure distributions.
  - *Disclaimer*: **Experimental Prototype Demonstrator**. SPH particle physics calculations are implemented for visual demonstration of Lagrangian wave fronts and are not validated for engineering design.

---

## 4. Future Delft3D Integration

* **Delft3D-FLOW Configuration Deck Generator**: FloodHADR includes a complete Delft3D architecture module (`app/api/delft3d.py`) that parameterizes and generates valid Delft3D input decks (`.mdf`, `.dep`, `.bct`, `.src`).
* *Current Limitation*: Direct execution requires a pre-installed Delft3D executable environment (`DELFT3D_HOME` or `DELFT3D_EXEC` binary in system PATH). When external binaries are absent, the system gracefully generates ready-to-run input decks for external HPC cluster submission.

---

## 5. Future Google Earth Engine (GEE) Integration

* **Earth Observation (EO) Satellite Interface**: FloodHADR defines a modular satellite provider interface (`app/satellite/provider_interface.py`) and dynamic water detection algorithm (Otsu thresholding & MNDWI index extraction).
* *Current Limitation*: Live Google Earth Engine execution requires authentic GEE Service Account credentials (`gee_key.json`). In demo mode, the system utilizes local synthetic Sentinel-1/2 SAR rasters.

---

## 6. Future Validated Hydrodynamic Modelling

* **Full 2D/3D Shallow Water Validation**: High-fidelity disaster planning requires physical hydraulic model validation, 3D turbulence modeling (k-$\epsilon$), and calibration against historical gauge records (e.g. 2013 Kedarnath or 2021 Chamoli events).
* **High-Resolution LIDAR & 12m DEM Integration**: Future releases will support direct ingestion of high-density Airborne LIDAR point clouds and 12m WorldDEM rasters for fine-grained urban street flow modeling.
