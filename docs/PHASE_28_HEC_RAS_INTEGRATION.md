# PHASE 28 — REAL HEC-RAS REFERENCE INTEGRATION

## Executive Summary & Scientific Integrity Mandate
Phase 28 integrates USACE **HEC-RAS** (2D SWE & 2D DWE) as an independent hydraulic reference and validation pathway.

### Governing Integrity Rule:
> **"HEC-RAS results are NEVER represented by fabricated values. A locally generated FloodHADR simulation result is NEVER called HEC-RAS."**
>
> When native HEC-RAS binaries or result packages (`.p01.hdf` or GeoTIFF/GeoJSON exports) are absent from local storage, the system displays:
> ```text
> HEC-RAS RESULT STATUS: NOT AVAILABLE
> ```
> Users can upload or place real HEC-RAS result packages directly into the repository to perform validation comparisons.

---

## 1. Directory Structure

The repository maintains the following source-controlled workspace structure:

```text
data/hec_ras/
  ├── projects/   # Native USACE HEC-RAS project files (.prj, .g01, .p01)
  ├── terrain/    # HEC-RAS terrain rasters (.hdf, .tif)
  ├── geometry/   # 2D Flow Area mesh geometry files (.g01, .g01.hdf)
  ├── flow/       # Unsteady flow hydrograph boundary files (.u01)
  ├── results/    # Result packages (.p01.hdf, .json, .geojson, .tif)
  └── metadata/   # Normalized project metadata manifests
```

---

## 2. Common Schema Normalization (`HECRASNormalizedResult`)

Imported native HEC-RAS HDF files and export packages are normalized into FloodHADR's standard schema:

| Schema Component | Key Name | Unit / Type | Description |
| :--- | :--- | :--- | :--- |
| **Time Series** | `time_series_sec` | s | Array of simulation timestamps |
| **Water Depth** | `depth` | m | 2D matrix of water depths ($h$) |
| **Velocity Magnitude** | `velocity` | m/s | 2D matrix of velocity magnitudes ($V$) |
| **Velocity X** | `velocity_x` | m/s | 2D matrix of eastward velocity components ($u$) |
| **Velocity Y** | `velocity_y` | m/s | 2D matrix of northward velocity components ($v$) |
| **Water Surface Elev.** | `water_surface_elevation` | m MSL | $WSE(y,x) = Z(y,x) + h(y,x)$ |
| **Arrival Time** | `arrival_time` | s | 2D matrix of wave arrival timestamps |
| **Inundation Extent** | `inundation_extent` | Boolean Grid / Polygon | Wet-cell mask ($h \ge 0.05\,\text{m}$) and flooded area ($\text{km}^2$) |
| **Mesh Metadata** | `mesh_metadata` | Dimensions / Resolution | Rows, cols, cell size ($\Delta x = \Delta y = 25\,\text{m}$), total cell count |
| **Coordinate System** | `coordinate_system` | CRS | Native `EPSG:32644` (UTM 44N) $\rightarrow$ Display `EPSG:4326` (WGS84) |

---

## 3. Metadata Header Schema

Every HEC-RAS reference dataset stores 12 metadata parameters:

```typescript
interface HECRASMetadata {
  hec_ras_version: string;     // e.g. "HEC-RAS 6.4.0"
  project_name: string;        // e.g. "Tehri_Dam_Break_2D"
  geometry_version: string;    // e.g. "g01.gpkg"
  terrain: string;             // e.g. "12.5m ALOS PALSAR DEM"
  roughness: string;           // e.g. "Manning n = 0.035 (Main Channel)"
  mesh_resolution: string;     // e.g. "25m x 25m Structured Mesh"
  timestep: string;            // e.g. "1.0s (Adaptive CFL <= 0.45)"
  boundary_conditions: string; // e.g. "Upstream Q(t), Downstream Normal Depth S0=0.008"
  simulation_duration: string; // e.g. "6.0 Hours (21,600s)"
  scenario: string;            // e.g. "scen-tehri-pmf-001"
  source_file: string;         // e.g. "tehri_dam_break_hecras.p01.hdf"
  execution_date: string;      // ISO 8601 Timestamp
  provenance: 'REAL_HEC_RAS_HDF' | 'IMPORTED_HEC_RAS_EXPORT' | 'REFERENCE_PACKAGE';
}
```

---

## 4. API Specification

* **`GET /api/v1/hecras/status`**: Audits HEC-RAS presence and returns availability status.
* **`GET /api/v1/hecras/results`**: Serves normalized HEC-RAS reference payload. Returns HTTP `503 Service Unavailable` with `STATUS: NOT AVAILABLE` if missing.
* **`POST /api/v1/hecras/import`**: Accepts HEC-RAS export package uploads and normalizes them into common schema.

---

## 5. Deliverables & Verification

1. **Documentation**: Created [`docs/PHASE_28_HEC_RAS_INTEGRATION.md`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/docs/PHASE_28_HEC_RAS_INTEGRATION.md).
2. **Backend Service**: Created [`backend/app/hec_ras/hec_ras_reference_service.py`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/backend/app/hec_ras/hec_ras_reference_service.py).
3. **API Router**: Created [`backend/app/api/hecras.py`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/backend/app/api/hecras.py).
4. **Automated Test Suite**: Created [`backend/test_phase28_hec_ras_reference.py`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/backend/test_phase28_hec_ras_reference.py) (`Ran 4 tests in 0.047s - OK`).
