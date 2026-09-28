# PHASE 36 — REAL HYDRAULIC-TO-HADR PIPELINE

## Executive Summary
Phase 36 replaces all independent synthetic or static flood estimations in HADR with a direct, real-time spatial intersection pipeline consuming authoritative 2D hydrodynamic solver matrices (`depth`, `velocity`, `arrival_time`, `duration`, `flood_extent`).

---

## Technical Specifications & Architecture

### 1. Direct Solver Matrix Consumption
The HADR engine strictly consumes the active simulation outputs without building or re-running independent synthetic flood calculations:
- `simulation_id`
- `scenario_id`
- `time` / `time_step_min`
- `depth` raster/matrix
- `velocity` raster/matrix
- `arrival_time` raster/matrix
- `duration` raster/matrix
- `flood_extent` mask

---

### 2. Spatial Intersection Across 9 Asset Categories
The HADR pipeline intersects the hydraulic field matrices with 9 explicit asset categories:
1. **Buildings:** Emergency Operations Center, Downstream Civic Center
2. **Roads:** NH-34 Rishikesh Corridor, Tehri Dam Access Highway
3. **Bridges:** Tehri Main Suspension Bridge, Koti Nala Highway Crossing
4. **Schools:** Chamba High School & Relief Assembly
5. **Hospitals:** District Civil Hospital Tehri, Devprayag Base Trauma Center
6. **Power Infrastructure:** Tehri HEP 1000MW Power Plant, Tehri 400kV Substation
7. **Administrative Facilities:** Tehri District Collectorate
8. **Population:** Tehri Valley Downstream Residential Sector, Devprayag Confluence Settlement
9. **Agriculture:** Bhagirathi Terraced Farmland, Devprayag Orchard Zone

---

### 3. Per-Asset Calculated Metrics
For every evaluated asset, the pipeline computes 9 dynamic fields directly from the spatial grid cell `(r, c)` intersection:
- `asset_id`: String identifier
- `location`: `{ lat, lng, world_x, world_z, grid_r, grid_c }`
- `flood_arrival_time_min`: Arrival time sampled from cell matrix ($\text{min}$)
- `maximum_depth_m`: Depth sampled from cell matrix ($\text{m}$)
- `maximum_velocity_ms`: Flow velocity sampled from cell matrix ($\text{m/s}$)
- `flood_duration_hr`: Duration computed from arrival time and depth ($\text{hr}$)
- `hazard_class`: `NONE` | `LOW` | `MODERATE` | `HIGH` | `EXTREME`
- `exposure`: `EXPOSED` | `UNEXPOSED`
- `status`: `SAFE` | `AT_RISK` | `FLOODED` | `SUBMERGED` | `CRITICAL`

---

### 4. Dynamic HADR Output Rule (No Static Hardcoded Counts)
- Static counts like "6 facilities" or "5 facilities" have been completely eliminated.
- Total exposed assets (`total_exposed_assets`), blocked roads count, and affected population are dynamically aggregated from cell-by-cell matrix intersection with the active simulation frame.
- When the simulation timestep or scenario changes ($t = 0\text{ min} \rightarrow t = 30\text{ min} \rightarrow t = 180\text{ min}$), the HADR results dynamically update in real time.

---

## Verification & Automated Test Suite
- **Test File:** `backend/test_phase36_real_hadr_pipeline.py`
- **Coverage:**
  1. `test_hadr_consumes_hydraulic_solver_matrix_without_synthetic_calculation`: Validates matrix consumption and status `COMPUTED_FROM_HYDRAULIC_GRID`.
  2. `test_asset_inventory_spatial_intersection`: Validates coverage of all 9 asset categories.
  3. `test_per_asset_calculated_metrics`: Validates 9 per-asset calculated fields.
  4. `test_hadr_results_change_dynamically_when_simulation_changes`: Proves HADR outputs change dynamically across simulation timestamps without static hardcoding.
