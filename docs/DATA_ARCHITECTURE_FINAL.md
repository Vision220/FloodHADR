# FLOODHADR — FINAL DATA ARCHITECTURE & INFORMATION HIERARCHY SPECIFICATION

## 1. Executive Summary
This document defines the final authoritative **Information Architecture and Data Ownership Matrix** for the **FloodHADR** platform.
By eliminating redundant data cards, duplicate matrix recalculations, and competing dashboard screens, the system provides a clean, professional, scientific decision-support environment with a single source of truth for every dataset.

---

## 2. Data Ownership & Primary Module Matrix

```
                          SINGLE SOURCE OF TRUTH
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
HYDRODYNAMIC ENGINE             GE OREFERENCE SERVICE           GEE EO SERVICE
(Backend 2D Solver)            (WGS84 EPSG:4326 State)       (Remote Sensing Engine)
```

| Dataset Category | Primary Authoritative Page | Purpose Question Answered | Secondary Module Access Strategy |
| :--- | :--- | :--- | :--- |
| **High-Level Situational Status** | `DashboardPage` (`/dashboard`) | *What is happening right now?* | Summary stats + direct navigation links |
| **Study Area & River Reach** | `StudyAreaPage` (`/study-area`) | *Where is it happening?* | ROI bounding box & river GIS layers |
| **DEM & Raw Input Ingestion** | `DataInputPage` (`/data`) | *What datasets are available?* | DEM metadata link & resolution status |
| **Scenario Input Parameters** | `DamBreakScenarioPage` (`/dam-break`) | *What scenario are we simulating?* | Scenario builder -> Run Simulation |
| **Simulation Execution State** | `SimulationPage` (`/simulation`) | *How is the simulation progressing?* | Hydrograph & timeline execution |
| **Spatial Flood Results** | `FloodMapPage` (`/flood-map`) | *Where is the flood water going?* | Primary 2D GIS spatial depth/velocity |
| **HADR Infrastructure Impact** | `ImpactAnalysisPage` (`/impact-analysis`) | *What assets & populations are affected?* | Asset exposure table & vulnerability |
| **EO Remote Sensing & SAR** | `EarthEnginePage` (`/earth-engine`) | *What does satellite observation show?* | Sentinel-1 SAR flood extent & GEE IoU |
| **Geospatial 3D Digital Twin** | `DigitalTwin3DPage` (`/3d-flood-twin`) | *What does the event look like in 3D?* | Georeferenced Three.js canvas & Inspector |
| **Scenario Differential Matrix** | `ScenarioComparisonPage` (`/scenario-comparison`) | *How do scenarios differ?* | Differential comparison matrix |
| **Consolidated Decision Report** | `ReportsExportPage` (`/reports`) | *What is the complete consolidated result?* | Exportable PDF/GeoTIFF report |

---

## 3. Data Display Level Hierarchy

- **Level 1 (Critical Information)**: Immediately visible on top HUDs (Current Scenario, Simulation Status, Peak Discharge, Max Depth, Inundated Area, Critical Assets).
- **Level 2 (Important Information)**: Accessible via tabbed cards and split views.
- **Level 3 (Technical Information)**: Inspected via contextual drawers (`InspectorPanel`, `CrossSectionChartModal`).
- **Level 4 (Raw Data Products)**: Downloadable via `ReportsExportPage` (GeoJSON, GeoTIFF, KML, CSV).

---

## 4. Single Source of Truth Services

1. **`AppContext.tsx`**: Manages global active scenario, selected study area, dam parameters, and simulation state.
2. **`GeoReferenceService.ts`**: Governs spatial reference systems (WGS84 `EPSG:4326`), bounding boxes, and deterministic 2D-to-3D coordinate projection.
3. **`Map3DSynchronizationService.ts`**: Coordinates real-time bidirectional selection, camera movements, timeline scrubbing, and layer visibility between 2D GIS and 3D Digital Twin.
4. **`GEEService` (`gee_service.py`)**: Authoritative backend remote-sensing service serving Sentinel-1 SAR, Sentinel-2 Optical, CHIRPS precipitation, and Dynamic World land cover datasets.

---

## 5. Verification & Testing

- **Build Verification**: Executed `npm run build` — `✓ built in 3.00s` (0 TypeScript / JSX compilation errors).
- **Backend API Health**: Tested `GET /api/health` — `200 OK` (FastAPI 2D Hydrodynamic Engine Online).
- **GEE Integration**: Tested `GET /api/gee/status` — `200 OK` (Fail-safe initialization active).
