# FLOODHADR — DATA REDUNDANCY AUDIT REPORT

## 1. Executive Overview
This audit inspects the entire **FloodHADR** prototype across frontend pages, backend services, API endpoints, state management, UI cards, and 3D visualization layers to identify duplicated information, redundant calculations, and overlapping interface components.

---

## 2. Identified Data Duplications

### A. Dashboard & Secondary Pages
- **Issue**: The main Dashboard previously displayed redundant full technical specification tables (e.g., complete DEM ALOS PALSAR metadata, complete dam hydrostatics tables, full 72-timestep simulation arrays), causing visual clutter and competing with dedicated pages (`DataInputPage`, `DamReservoirIntelligencePage`, `SimulationPage`).
- **Resolution**: Convert Dashboard to a high-level situational awareness hub (Level 1 critical metrics: Current Scenario, Simulation Status, Max Depth, Peak Discharge, Flood Extent Area, Affected Assets Count) with direct navigation links (`[VIEW FLOOD MAP]`, `[VIEW IMPACT ANALYSIS]`, `[VIEW EARTH OBSERVATION]`).

### B. 3D Digital Twin Page
- **Issue**: The 3D Digital Twin page previously rendered full-width duplicate cards for global peak discharge, total reservoir storage, and full asset exposure lists that duplicated the `ImpactAnalysisPage` and `SimulationPage`.
- **Resolution**: Streamline 3D Digital Twin controls into a clean 3D Canvas + Split View GIS Map layout with a compact, contextual **3D Object Inspector** that populates when a specific location or asset is selected.

### C. GEE Earth Engine Page vs Satellite Map
- **Issue**: Potential overlap between Google Maps Satellite basemap (visual background) and GEE Sentinel-1/2 SAR remote sensing data (analytical remote sensing).
- **Resolution**: Explicitly differentiate basemaps (Google Satellite/Hybrid for background geometry) from Earth Observation analysis layers (GEE Sentinel-1 SAR flood boundaries, GEE Sentinel-2 NDVI, CHIRPS rainfall) with clear provenance badges (`OBSERVED`, `DERIVED`, `SIMULATED`).

### D. Calculation & State Duplication
- **Issue**: Multiple components independently computed maximum water depth, maximum flow velocity, and flooded area from raw matrices.
- **Resolution**: Consolidate calculations into authoritative backend services (`hydrodynamics.py`, `analysis.py`, `gee_service.py`) and single source of truth state (`AppContext`, `GeoReferenceService`, `Map3DSynchronizationService`).

---

## 3. Data Ownership Matrix

| Dataset Category | Authoritative Primary Page / Module | Secondary Page Reference Strategy |
| :--- | :--- | :--- |
| **Dam & Reservoir Technical Specs** | `DamReservoirIntelligencePage` (`/dam-reservoir`) | Summary badge + `[VIEW DAM SPECS]` link |
| **Study Area Boundary & Rivers** | `StudyAreaPage` / `BasinIntelligencePage` (`/basin-intelligence`) | GIS Layer overlay + GeoJSON reference |
| **DEM Terrain & GIS Ingestion** | `DataInputPage` (`/data`) | Terrain mesh rendering + Metadata link |
| **Scenario Parameters & Inputs** | `DamBreakScenarioPage` / `CompoundFloodPage` | Input parameters -> Run Simulation pipeline |
| **Hydrodynamic Simulation Outputs** | `SimulationPage` / `FloodMapPage` | Spatial depth/velocity layers on 2D GIS map |
| **HADR Asset Exposure & Vulnerability**| `ImpactAnalysisPage` (`/impact-analysis`) | Compact asset counter badge + link |
| **Satellite & EO Remote Sensing** | `EarthEnginePage` (`/earth-engine`) | GEE SAR observed boundary comparison overlay |
| **Geospatial 3D Scene Reconstruction**| `DigitalTwin3DPage` (`/3d-flood-twin`) | Georeferenced Three.js canvas & Object Inspector |
| **Scenario Comparison Matrix** | `ScenarioComparisonPage` (`/scenario-comparison`) | Comparative differential matrix only |
| **Consolidated Decision Report** | `ReportsExportPage` (`/reports`) | Consolidated PDF/GeoTIFF export from single sources of truth |

---

## 4. Remediation Action Plan
1. **Single Source of Truth**: Enforce `GeoReferenceService` and `AppContext` as unified state providers.
2. **Dashboard Streamlining**: Convert Dashboard into Level 1 Situational Awareness.
3. **3D Page Simplification**: Keep 3D Digital Twin focused on spatial visual rendering and contextual inspection.
4. **Navigation Purpose Alignment**: Ensure every page answers exactly one clear question.
