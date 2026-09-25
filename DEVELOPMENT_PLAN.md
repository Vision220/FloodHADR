# FloodHADR - Hackathon Development & Execution Plan

> **Smart India Hackathon (SIH) 2026 Strategy & Roadmap**  
> **Problem Statement ID:** 26161 (NTRO)  

---

## 🎯 Master Implementation Roadmap

This document details the phase-by-phase development sprint plan to transform the FloodHADR architecture into a fully functional, production-ready hackathon prototype.

---

## Phase 1: Environment Setup & Project Boilerplate
- [ ] Initialize frontend repository structure using Vite + React + TypeScript.
- [ ] Configure Tailwind CSS, dark glassmorphism color theme, Google Fonts (Inter/Outfit), and Lucide icons.
- [ ] Setup backend directory structure using FastAPI, Python 3.11, Uvicorn, and standard package dependencies.
- [ ] Create `requirements.txt` (FastAPI, NumPy, Rasterio, GeoPandas, Shapely, PyProj, ReportLab, SQLAlchemy).
- [ ] Create basic backend entrypoint (`main.py`) with CORS middleware and OpenAPI health check endpoints.

---

## Phase 2: Core Data Models, Database Schemas & Sample Datasets
- [ ] Configure SQLite asynchronous database connection using SQLAlchemy 2.0 ORM.
- [ ] Implement database models:
  - `StudyArea` (name, bounding box, DEM path, EPSG projection code)
  - `DamSpec` (dam name, height, crest length, reservoir capacity, storage curve)
  - `DamBreakScenario` (failure mode, breach width, formation time, peak discharge)
  - `SimulationRun` (status, timesteps, maximum inundated area, GeoJSON path)
  - `HADRImpactReport` (threatened hospitals, power grids, population risk index)
- [ ] Create sample DEM generation scripts (`generate_sample_dem.py`) for standard demo study areas (Tehri Dam, Hirakud Dam, Idukki Dam, Mullaperiyar Dam).
- [ ] Create mock critical infrastructure layer GeoJSON datasets (Hospitals, Schools, Bridges, Evacuation Centers).

---

## Phase 3: Dam-Break Hydrograph & 2D Inundation Engine
- [ ] Implement `breach_hydrograph.py`:
  - Empirical breach width and formation time calculations (Froehlich 2008 & Ritter equations).
  - Outflow hydrograph curve generator ($Q$ vs $t$).
- [ ] Implement `prototype_solver.py`:
  - 2D Cellular Automata / Diffusive Wave raster solver over DEM elevation matrix.
  - Cell-by-cell water depth $H(i,j,t)$ calculation using Manning's equation.
  - Wave front arrival time tracker ($T_{arr}$ when depth $> 0.1\text{m}$).
  - Maximum inundation envelope extractor.

---

## Phase 4: HADR Spatial Impact Analysis & Evacuation Engine
- [ ] Implement `hadr_analyzer.py`:
  - Spatial overlay of maximum flood depth contours against infrastructure point features using GeoPandas & Shapely.
  - Vulnerability severity scoring (Low risk vs High risk vs Submerged).
  - Population risk index calculation based on inundated land area density.
- [ ] Implement evacuation path generator:
  - Identification of safe high-ground shelter nodes outside the flood footprint.
  - Shortest path distance calculations to nearest safe shelter.

---

## Phase 5: REST API Controllers & Business Logic
- [ ] `/api/v1/study-areas`: Endpoints for listing and creating river study areas.
- [ ] `/api/v1/dams`: Endpoints for dam parameters and storage curves.
- [ ] `/api/v1/scenarios`: Hydrograph calculation and scenario configuration endpoints.
- [ ] `/api/v1/simulations`: Asynchronous execution trigger, progress polling, and result fetch endpoints.
- [ ] `/api/v1/hadr`: Impact report query and evacuation route request endpoints.
- [ ] `/api/v1/export`: GeoJSON, GeoTIFF, and PDF report generation endpoints.

---

## Phase 6: Frontend Pages & Interactive GIS Dashboard
- [ ] **State Management**: Create Zustand store (`useAppStore.ts`) for active study area, dam parameters, simulation state, and selected time step.
- [ ] **Navigation & Shell**: Create navbar, sidebar, dark-mode layout container.
- [ ] **GIS Map Component (`GISMap.tsx`)**:
  - React-Leaflet canvas integration.
  - Multi-layer controls (DEM basemap, breach origin marker, inundation depth heatmaps, critical infrastructure markers, evacuation route lines).
  - Dynamic Time-Slider control for dynamic temporal playback of flood wave progression.
- [ ] **Hydrograph & Analytics Components**: Recharts hydrograph viewer, depth distribution charts, elevation cross-section profiles.
- [ ] **Build All 11 Pages**:
  1. `DashboardPage.tsx`
  2. `StudyAreasPage.tsx`
  3. `DamDataPage.tsx`
  4. `ScenarioBuilderPage.tsx`
  5. `SimulationPage.tsx`
  6. `InundationAnalysisPage.tsx`
  7. `HADRImpactPage.tsx`
  8. `GISMapPage.tsx`
  9. `ComparePage.tsx`
  10. `ExportPage.tsx`
  11. `ExternalEnginesPage.tsx`

---

## Phase 7: Reporting & Export Engine
- [ ] Implement ReportLab PDF generator (`pdf_generator.py`) producing executive disaster management briefs with summary tables, risk meters, and HADR recommendations.
- [ ] Implement GeoTIFF exporter converting inundation matrices into downloadable spatial rasters.
- [ ] Implement CSV export for breach hydrographs and elevation profiles.

---

## Phase 8: External Engine Adapters & GEE Satellite Mock
- [ ] Implement `HydroEngineAdapter` abstract base class.
- [ ] Create `delft3d_adapter.py` mock adapter illustrating grid file preparation and NetCDF result parsing.
- [ ] Create `sph_adapter.py` mock adapter illustrating particle generation and VTK output parsing.
- [ ] Build `/engine-integrations` page presenting engine statuses, grid conversion logs, and mock Copernicus Sentinel-1 SAR flood validation overlay.

---

## Phase 9: Verification, UI Polish & Documentation
- [ ] End-to-end testing of simulation execution pipeline from study area selection to PDF export.
- [ ] Verify responsive design, dynamic micro-animations, color contrast, and Leaflet layer switching speed.
- [ ] Finalize code comments, documentation links, and hackathon presentation pitch highlights.

---

## 📅 Sprint Schedule Summary

```mermaid
gantt
    title FloodHADR Hackathon Sprint Timeline
    dateFormat  YYYY-MM-DD
    section Setup & Core
    Phase 1: Environment & Setup    :done, p1, 2026-09-23, 1d
    Phase 2: Data Models & DEM      :active, p2, 2026-09-23, 1d
    section Engines & Logic
    Phase 3: Hydro Simulation Engine :p3, 2026-09-24, 2d
    Phase 4: HADR Impact & Routing   :p4, 2026-09-25, 1d
    section Backend & API
    Phase 5: REST API Controllers   :p5, 2026-09-26, 1d
    section Frontend & GIS
    Phase 6: React UI & Leaflet GIS :p6, 2026-09-27, 2d
    section Integration & Export
    Phase 7: Reports & Export       :p7, 2026-09-28, 1d
    Phase 8: External Adapters      :p8, 2026-09-29, 1d
    Phase 9: Verification & Polish  :p9, 2026-09-30, 1d
```
