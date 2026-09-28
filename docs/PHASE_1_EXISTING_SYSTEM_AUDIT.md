# Phase 1 — FloodHADR Existing Prototype Technical Audit

**Date:** September 26, 2026  
**Status:** COMPLETED (AUDIT ONLY — NO CODE MUTATIONS PERFORMED)  
**System:** FloodHADR Integrated Dam-Break, Flood Simulation & HADR Decision Support Platform  

---

## Executive Summary

A comprehensive, end-to-end audit of the FloodHADR repository was conducted across frontend components, backend services, database schemas, simulation modules, GIS processing, 2D/3D visualization layers, HADR calculation routines, satellite/GEE integrations, AI surrogates, and automated test suites.

The audit revealed that while the system contains an extensive feature set and high-level architectural abstractions, **the system currently lacks a single authoritative hydraulic simulation engine**. Instead, flood depths, velocities, inundation areas, and risk categories are calculated independently in multiple competing backend modules, as well as on the frontend, and in mock API handlers. Furthermore, external model comparison modules (such as HEC-RAS) are adapter stubs rather than active numerical validation engines.

---

## Detailed Audit Checklist & Findings (20 Core Search Items)

| Item # | Audit Search Item | Finding & Specific File / Code Location | Classification |
|---|---|---|---|
| **1** | **Multiple Flood Simulation Engines** | Found 4 competing backend engines: <br>1. `FloodSimulationEngine` (`app/simulation/engine.py` - 2D raster engine)<br>2. `HydrodynamicEngine` (`app/simulation/hydrodynamic_engine.py` - analytical formula engine)<br>3. `Prototype2DHydroSolver` (`app/simulation/prototype_solver.py` - hardcoded empirical hydrograph engine)<br>4. `MultiModelStudio` (`app/simulation/multi_model_studio.py` - power-law formula engine) | **REFACTOR / ISOLATE** (`engine.py` to become single authoritative source; others to be removed/refactored) |
| **2** | **Hard-Coded Flood Depth** | Found hardcoded depth metrics in multiple files: <br>• `backend/app/simulation/prototype_solver.py` (L16: `14.6m`, L31-41: fixed depth series)<br>• `backend/app/simulation/simple_flood_model.py` (L17: `14.6m`)<br>• `backend/app/api/simulation.py` (L118: `14.6m`)<br>• `backend/app/gis/gis_exporter.py` (L28, L36, L44, L52: fixed ratio multipliers)<br>• `frontend/src/services/api.ts` (L97: `12.4m` fallback, L155-164: fixed asset depths) | **REMOVE** (Replace with authoritative raster lookup) |
| **3** | **Hard-Coded Velocity** | Found hardcoded velocity metrics: <br>• `backend/app/simulation/prototype_solver.py` (L18: `8.4 m/s`)<br>• `backend/app/api/simulation.py` (L119: `8.4 m/s`)<br>• `backend/app/gis/gis_exporter.py` (L29: `8.4 m/s`, L37: `5.2 m/s`, L45: `3.4 m/s`, L53: `1.1 m/s`)<br>• `frontend/src/services/api.ts` (L98: `7.8 m/s`) | **REMOVE** (Replace with authoritative velocity raster calculation) |
| **4** | **Hard-Coded Inundation Area** | Found hardcoded inundation area values: <br>• `backend/app/simulation/prototype_solver.py` (L15: `184.2 km²`)<br>• `backend/app/simulation/simple_flood_model.py` (L19: `184.2 km²`)<br>• `backend/app/api/simulation.py` (L117: `scenario.breach_width_m * 1.5`)<br>• `backend/app/main.py` (L83: `184.2 km²` in default database seed) | **REMOVE** (Replace with actual cell threshold integration) |
| **5** | **Hard-Coded Population** | Found hardcoded population impact metrics: <br>• `backend/app/simulation/prototype_solver.py` (L18: `142,500`)<br>• `backend/app/api/simulation.py` (L120: `142,500`)<br>• `backend/app/main.py` (L86: `142,500`)<br>• `frontend/src/services/api.ts` (L99: `124,500`, L140: `138,150`) | **REMOVE** (Replace with spatial overlay against population raster/vector layer) |
| **6** | **Static GeoJSON Flood Polygons** | Found hardcoded static GeoJSON polygons: <br>• `backend/app/simulation/prototype_solver.py` (L44-70: fixed polygon coordinates `[78.4802, 30.3781]`)<br>• `backend/app/gis/gis_exporter.py` (L25-58: 4 static Shapely Polygons)<br>• `backend/app/services/gee/gee_flood.py` (L85-115: hardcoded GeoJSON polygon for GEE flood extent) | **REPLACE** (Generate dynamic vector polygons from authoritative simulation raster frames) |
| **7** | **Random Flood Generation** | Found random variation injected into simulation state: <br>• `frontend/src/simulation/DigitalTwinEngine.ts` (L103: `Math.random()` used to randomize cell velocity matrix `maxVel * (0.6 + Math.random() * 0.4)`) | **REMOVE** (Must strictly derive from backend physics state without frontend randomness) |
| **8** | **Synthetic DEM** | Found synthetic DEM generation tools used as production fallbacks: <br>• `backend/app/utils/synthetic_dem.py` (generates 100x100 synthetic sin/exp DEM)<br>• `backend/app/api/dem.py` (L16-34: initializes `synthetic_tehri_dem.tif` when DEM store empty)<br>• `backend/app/data/demo/dem/dem_synthetic.json` | **DEMO ONLY** (Strictly isolate synthetic DEM to DEMO mode; require real GeoTIFF in REAL mode) |
| **9** | **Procedural 3D Terrain** | Found procedural terrain generation in 3D engine: <br>• `frontend/src/simulation/DigitalTwinEngine.ts` (L22-46: `generateTehriDemMatrix()` calculates math formula `830 - normR * 330 + valleyWallHeight + ridgeNoise`) | **REPLACE / DEMO ONLY** (In REAL mode, 3D mesh MUST use authoritative backend DEM grid) |
| **10** | **Frontend-Side Flood Calculations** | Found frontend TypeScript files computing flood dynamics independently of backend: <br>• `frontend/src/simulation/DigitalTwinEngine.ts` (L51-157: computes `currentQ`, `maxDepth`, `depthMatrix`, `waveFrontRow`, `floodedAreaKm2`)<br>• `frontend/src/simulation/PrototypeFloodModel.ts` (L70-139: calculates state updates, stages, wave front distance, depth/velocity) | **REMOVE / REFACTOR** (Frontend must consume backend `SimulationFrame` API payloads only) |
| **11** | **Backend-Side Competing Calculations** | Found backend endpoints calculating hydraulics using simplified formulas instead of simulation engine: <br>• `backend/app/simulation/hydrodynamic_engine.py` (L127: analytical depth `0.4 * Q^0.38`, L138: exponential attenuation raster `exp(-dist/1200)`)<br>• `backend/app/simulation/multi_model_studio.py` (L50: `0.38 * Q^0.38`, L84: `0.42 * Q^0.38`, L118: `0.44 * Q^0.38`) | **REMOVE / REFACTOR** (Consolidate into single 2D Saint-Venant / Diffusive-Wave solver core) |
| **12** | **Fake API Responses** | Found mock/fallback returns in API services: <br>• `frontend/src/services/api.ts` (L86-110: `runSimulation` returns client-side synthetic object without fetching backend API)<br>• `frontend/src/services/api.ts` (L136-166: `getHADRImpact` returns static 10 feature array fallback when API fails) | **REFACTOR** (Connect frontend directly to backend API; raise explicit errors in REAL mode) |
| **13** | **Fake Real-Time Data** | Found simulated real-time sensor streams: <br>• `backend/app/sensors/sensor_provider.py` (generates synthetic sine-wave water levels with `simulated_live_data: True`)<br>• `frontend/src/pages/RealtimeMonitoringPage.tsx` | **DEMO ONLY** (Label clearly as SIMULATED / DEMO MODE when live gauge feed is offline) |
| **14** | **Fake GEE Responses** | Found fake Google Earth Engine responses: <br>• `backend/app/services/gee/gee_flood.py` (L83: hardcoded `observed_area_km2 = 24.8` and static GeoJSON feature collection)<br>• `frontend/src/services/api.ts` (L225-250: client demo calculation fallback for GEE monitoring) | **REFACTOR / DEMO ONLY** (Real GEE mode must query Earth Engine API; fallbacks marked DEMO) |
| **15** | **Fake AI Responses** | Found AI / ML surrogates returning closed-form synthetic estimates: <br>• `backend/app/simulation/multi_model_studio.py` (DeepANN surrogate model returns hardcoded formula outputs without actual ANN inference)<br>• Frontend `ModelComparisonPage.tsx` | **EXPERIMENTAL / DEMO ONLY** (Do not present closed-form estimates as validated AI models) |
| **16** | **Synthetic Infrastructure** | Found synthetic infrastructure layers: <br>• `backend/app/data/demo/hospitals/`, `roads/`, `buildings/`, `schools/`<br>• `backend/app/gis/impact_analyzer.py` (loads hardcoded GeoJSON files) | **DEMO ONLY** (Label as DEMO data; allow real GIS vector layer upload in REAL mode) |
| **17** | **Disconnected 2D and 3D Models** | Found 2D map and 3D Digital Twin using separate simulation runtimes and separate time steps: <br>• 2D map uses Leaflet/Mapbox vector layers with backend `SimulationRunModel`<br>• 3D Twin (`DigitalTwin3DPage.tsx`) uses `DigitalTwinEngine.ts` local state loop | **REPLACE** (3D Digital Twin must bind directly to backend `SimulationFrame` frames used by 2D map) |
| **18** | **Existing HEC-RAS Functionality** | Found HEC-RAS implementation status: <br>• `backend/app/simulation/multi_model_studio.py` (L138-160: `HECRASAdapter` with `is_installed_and_tested=False`, `model_notice="ADAPTER IMPORT/EXPORT READY — HEC-RAS ENGINE NOT INSTALLED LOCALLY"`)<br>• No HEC-RAS execution binaries, CLI wrappers, or comparison parser exist in backend. | **REPLACE / IMPLEMENT** (Build genuine HEC-RAS output parser / benchmark comparison module) |
| **19** | **Duplicate HADR Calculations** | Found duplicate HADR impact calculation logic: <br>• `backend/app/gis/impact_analyzer.py` (GeoPandas spatial intersection)<br>• `backend/app/simulation/predictive_hazard_engine.py` (L89-113: `_get_affected_assets()` depth threshold checks)<br>• `frontend/src/simulation/PrototypeFloodModel.ts` (L127-134: hardcoded asset count thresholds) | **REMOVE / CONSOLIDATE** (Single authoritative HADR impact module in backend `impact_analyzer.py`) |
| **20** | **Hard-Coded Localhost API URLs** | Found hardcoded localhost URLs: <br>• `frontend/src/services/api.ts` (L3: `export const API_BASE_URL = 'http://localhost:8000/api';`)<br>• `backend/test_api_endpoints.py` (L6: `BASE_URL = "http://localhost:8000"`) | **REFACTOR** (Use environment variable `VITE_API_BASE_URL` with dynamic relative fallback) |

---

## Detailed Classification Summary

### 1. KEEP
- `backend/app/simulation/engine.py` (`FloodSimulationEngine` 2D raster engine core).
- `backend/app/simulation/grid.py` (`DEMGrid` spatial indexing).
- `backend/app/simulation/initial_conditions.py` (`InitialConditions` reservoir setup).
- `backend/app/simulation/dam_break.py` (`DamBreachModel` Froehlich breach kinetics).
- `backend/app/simulation/water_propagation.py` (`WaterPropagationSolver` 2D finite volume solver).
- `backend/app/simulation/velocity.py` (`VelocityEstimator` 2D velocity vector calculations).
- `backend/app/simulation/inundation.py` (`InundationTracker` max depth, arrival time, duration rasters).
- `backend/app/gis/dem_processor.py` (Rasterio GeoTIFF validation, CRS transformation, elevation stats).
- `backend/app/gis/impact_analyzer.py` (GeoPandas spatial overlay against infrastructure vector layers).
- `backend/app/services/gee/gee_auth.py` & `gee_client.py` (Real Earth Engine authentication & geometry wrappers).

### 2. REFACTOR
- `frontend/src/services/api.ts`: Eliminate client-side synthetic fallbacks in REAL mode; introduce strict error propagation; substitute `http://localhost:8000/api` with configurable environment variables.
- `backend/app/api/simulation.py`: Replace fixed dummy return values (`14.6m`, `8.4 m/s`, `184.2 km²`) with actual `FloodSimulationEngine.run()` invocation and SQLite frame persistence.
- `backend/app/gis/gis_exporter.py`: Replace static shape polygons with dynamic vectorization of authoritative simulation result rasters.
- `backend/app/services/gee/gee_flood.py`: Refactor GEE flood extraction to process real Earth Engine Sentinel-1 SAR collections when authenticated, gracefully flagging DEMO when unauthenticated.

### 3. REPLACE
- `frontend/src/simulation/DigitalTwinEngine.ts`: Replace client-side procedural terrain and random wave calculation with frame subscriber that consumes backend `SimulationFrame` payloads.
- `frontend/src/simulation/PrototypeFloodModel.ts`: Replace client-side parametric flood metric formulas with backend API polling / frame playback.
- `backend/app/simulation/multi_model_studio.py`: Replace synthetic power-law formula stubs with verified numerical solver comparisons.
- 3D Visualization Pipeline (`DigitalTwin3DPage.tsx`): Replace decoupled 3D state with direct binding to 2D simulation frames.

### 4. REMOVE
- Competing analytical calculation functions in `backend/app/simulation/hydrodynamic_engine.py` (L127-140 exponential attenuation and peak depth approximations).
- Duplicate client-side HADR asset depth checks in `PrototypeFloodModel.ts` and `predictive_hazard_engine.py`.
- Hardcoded GeoJSON features in `prototype_solver.py` (`parse_output_to_geojson`).
- `Math.random()` velocity noise in frontend 3D rendering.

### 5. DEMO ONLY
- `backend/app/utils/synthetic_dem.py` and `backend/app/data/demo/dem/dem_synthetic.json`. Must strictly display "DEMO MODE" badge when active.
- `backend/app/sensors/sensor_provider.py` (synthetic stream gauge feed). Must be explicitly flagged as `SIMULATED LIVE DATA`.
- Infrastructure sample GeoJSON files (`backend/app/data/demo/hospitals/`, `roads/`, etc.).

### 6. EXPERIMENTAL
- `backend/app/simulation/sph/` and `sph_model.py` (Lagrangian particle demonstrator for local dam breach visualization). Must remain explicitly tagged as EXPERIMENTAL DEMONSTRATOR.
- `DeepANN Hydrodynamic Surrogate Model` in `multi_model_studio.py`. Must remain tagged as EXPERIMENTAL / NOT VALIDATED.

---

## Architectural Mapping & Baseline Data Flow

```
[User Input / Scenario]
         │
         ▼
[Hydrograph / SCS-CN / Breach Model] (backend/app/simulation/dam_break.py)
         │
         ▼
[Authoritative 2D Hydraulic Engine] (backend/app/simulation/engine.py: FloodSimulationEngine)
         │
         ├───► Summary Rasters (Max Depth, Velocity, Arrival Time, Duration)
         │
         ├───► SimulationFrame Series (t_0, t_1, ..., t_N)
         │           │
         │           ├───► 2D GIS Map (Leaflet / GeoJSON / Raster Overlay)
         │           │
         │           └───► 3D Digital Twin (Three.js / Mesh Surface from DEM + Frame Depth)
         │
         └───► GIS Impact Analyzer (backend/app/gis/impact_analyzer.py -> GeoPandas Spatial Overlay)
                     │
                     └───► HADR Decision Support & Executive Reports
```

---

## Recommended Correction Order for Subsequent Phases

1. **Phase 2 — Single Source of Truth Consolidation:** Establish `FloodSimulationEngine` (`app/simulation/engine.py`) as the SINGLE authoritative simulation engine across backend and frontend. Remove all duplicate calculation engines and hardcoded result constants.
2. **Phase 3 — Data Lineage & Provenance Architecture:** Enforce input ID, output ID, simulation ID, scenario ID, timestamp, and provenance metadata across every API response and UI display.
3. **Phase 4 — Parameter Responsiveness & Sensitivity Verification:** Ensure that modifying breach width, reservoir storage, Manning's n, DEM resolution, or timestep directly alters downstream hydrographs, flood depths, and inundation extents.
4. **Phase 5 — Numerical Stability & Conservation Audit:** Verify Courant-Friedrichs-Lewy (CFL) stability, adaptive timestep control, mass balance error tracking, positivity preservation, and wetting/drying mechanics.
5. **Phase 6 — HEC-RAS Benchmarking & Model Comparison:** Implement real HEC-RAS dataset parser/comparison framework with RMSE, MAE, IoU, and F1 metrics (without arbitrary score numbers).
6. **Phase 7 — 2D Map & 3D Digital Twin Synchronous Frame Pipeline:** Bind 3D mesh surface directly to backend DEM and 2D simulation frames; verify cross-layer asset selection synchronization.
7. **Phase 8 — HADR Impact & Infrastructure Integration:** Ensure HADR risk assessments derive dynamically from hydraulic rasters overlaid on GIS infrastructure layers.
8. **Phase 9 — AI Model Comparison & Rigor Framework:** Ensure AI assistant retrieves empirical simulation parameters, metrics, and limitations without hallucination or numerical invention.
9. **Phase 10 — Offline Demo Mode & Failure Safeguards:** Validate standalone offline DEMO mode and safe failure modes for missing rasters/APIs.
10. **Phase 11 — End-to-End Build & Automated Test Suite Verification:** Run comprehensive frontend and backend test suites, type checking, build validation, and final audit matrix generation.
