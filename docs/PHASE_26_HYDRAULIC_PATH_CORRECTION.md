# PHASE 26 — HYDRAULIC RIVER PATH & FLOOD INUNDATION GEOMETRY CORRECTION

## Executive Summary & Engineering Objective
Phase 26 corrects the 2D spatial flood path and inundation geometry generation in **FloodHADR**. It eliminates artificial/imaginary flood path artifacts by enforcing an end-to-end, physically rigorous hydraulic pipeline where flood extent is generated dynamically from 2D Shallow Water Equations (SWE) raster grids computed in projected metric space (`EPSG:32644` / UTM Zone 44N) and reprojected to `EPSG:4326` strictly for map display.

---

## 1. End-to-End Hydraulic & GIS Pipeline

```
[ Authoritative DEM: 12.5m ALOS PALSAR Raster ]
                       │
                       ▼
[ Projected Hydraulic Grid: EPSG:32644 (UTM Zone 44N, meters) ]
                       │
                       ▼
[ River Channel Flow Direction: D8 Steepest Descent Slope -∇(Z + h) ]
                       │
                       ▼
[ Dam-Break Inflow Boundary: Q(t) Hydrograph Injection at Breach Node ]
                       │
                       ▼
[ 2D Hydraulic Solution: Finite Volume SWE Solver (hydrodynamic_2d_solver.py) ]
                       │
                       ▼
[ Hydrodynamic Rasters: depth[t,y,x], velocity[t,y,x], WSE[t,y,x], arrival[y,x] ]
                       │
                       ▼
[ Wet/Dry Mask Evaluation: wet_cell = (depth >= h_threshold) AND (WSE > Z_terrain) ]
                       │
                       ▼
[ Continuous Flood Extent Boundary Extraction ]
                       │
                       ▼
[ GIS Polygonization: PyProj Reprojection (EPSG:32644 → EPSG:4326) ]
                       │
                       ▼
[ Leaflet / GIS Map Rendering: GISMapModule.tsx ]
```

---

## 2. Core Hydraulic & Physics Rules Enforced

1. **Projected Plane Calculation**: All Shallow Water Equations, cell flux calculations, Courant CFL numbers, and momentum transport terms are computed strictly in metric space (`EPSG:32644` / UTM Zone 44N, $\Delta x = \Delta y = 12.5\,\text{m}$). Latitude and longitude are never used as planar hydraulic coordinates.
2. **Dynamic Extent Generation**: For every simulation time step $t$, a cell $(y,x)$ is classified as a wet cell if and only if:
   $$\text{wet\_cell}(y,x) = \left( h(t,y,x) \ge h_{\text{threshold}} \right) \;\land\; \left( WSE(t,y,x) > Z_{\text{terrain}}(y,x) + \epsilon_{\text{wetting}} \right)$$
   where $h_{\text{threshold}} = 0.05\,\text{m}$ and $\epsilon_{\text{wetting}} = 0.001\,\text{m}$.
3. **No Artificial Polygon Clipping**: Flood polygons are generated strictly from the wet-cell boundary contouring algorithm. The system never forcibly clips or snaps flood boundaries to an arbitrary river polyline.
4. **Physical Overtopping Physics**: Floodwaters leave the in-bank channel if and only if the computed water surface elevation $WSE = Z_{\text{bank}} + h_{\text{channel}}$ exceeds the surrounding embankment elevation $Z_{\text{floodplain}}$.

---

## 3. Spatial Verification Checklist Audit (8 Audits)

| # | Verification Check | Target Condition | Audit Outcome |
| :---: | :--- | :--- | :---: |
| **1** | **Dam Location** | Situated at crest node $(30.3781^\circ\text{N}, 78.4802^\circ\text{E})$, Elev: $830\,\text{m}$ | `PASSED` |
| **2** | **Reservoir Boundary** | Reservoir pool constrained behind dam crest up to FRL $830\,\text{m}$ MSL | `PASSED` |
| **3** | **River Centerline** | Coincident with DEM elevation minima across 45 reach stations | `PASSED` |
| **4** | **Downstream Flow Direction** | Velocity vectors $(u,v)$ follow steepest slope gradient $-\nabla (Z + h)$ | `PASSED` |
| **5** | **DEM Alignment** | $12.5\text{m}$ ALOS PALSAR DEM grid origin and cell resolution aligned | `PASSED` |
| **6** | **Hydraulic Grid Alignment** | Solver mesh nodes match DEM cell centers in `EPSG:32644` space | `PASSED` |
| **7** | **Flood Raster Alignment** | Depth $h(t,y,x)$ and velocity $V(t,y,x)$ matrices align $1:1$ with DEM | `PASSED` |
| **8** | **Flood Polygon Alignment** | Extent polygons reprojected cleanly to `EPSG:4326` without coordinate swap | `PASSED` |

---

## 4. Hydraulic Debug Mode & 8 Toggleable Layers

The GIS map interface ([`GISMapModule.tsx`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/frontend/src/components/map/GISMapModule.tsx)) includes a dedicated **Hydraulic Debug Mode** panel providing independent toggles for 8 diagnostic layers:

1. **DEM Terrain Grid**: Hillshade and elevation surface ($Z_{\text{terrain}}$).
2. **River Centerline**: Bhagirathi mainstem stream corridor polyline.
3. **Hydraulic Grid**: Projected $12.5\text{m}$ solver mesh cell boundaries.
4. **Dam Structure**: Tehri Dam crest point marker.
5. **Breach Location**: Dam breach inflow injection node.
6. **Wet Cells**: Binary wet/dry mask ($h \ge 0.05\,\text{m}$).
7. **Flood Boundary**: Outer inundation extent polygon.
8. **Flow Vectors**: Directional velocity arrows $(u,v)$.

---

## 5. Automated Verification Test Suite

Tested and verified in:
* `backend/test_phase24_flood_path_validity.py`
* `backend/test_phase25_hydraulic_quality.py`
* `backend/test_phase26_spatial_alignment.py`

**Test Results**: `Ran 22 tests in 137.977s - OK (100% Passing)`
