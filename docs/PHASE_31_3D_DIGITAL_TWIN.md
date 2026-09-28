# Phase 31 Documentation: Real DEM-Driven 3D Hydrodynamic Digital Twin

## Architectural Overview

Phase 31 replaces decorative 3D visualization elements with an authoritative, georeferenced 3D Digital Twin driven directly by the ALOS PALSAR 12.5m DEM and the 2D Shallow Water Equations (SWE / DWE) simulation solver.

```
AUTHORITATIVE DEM (ALOS PALSAR 12.5m)
      ↓
Hydraulic Grid (30x30 Domain / EPSG:32644)
      ↓
2D Simulation (FloodHADR SWE / DWE / HEC-RAS)
      ↓
Depth / Velocity / Water Surface Elevation Frames
      ↓
3D Digital Twin (Three.js / React-Three-Fiber)
```

## Mandatory 13 Scene Elements

The 3D Digital Twin scene contains all 13 required spatial and hydraulic components:

1. **Real DEM Terrain**: Elevation matrix derived from ALOS PALSAR 12.5m DEM.
2. **Real River Alignment**: Bhagirathi River main channel geometry.
3. **Tehri Dam Position**: Georeferenced at 30.3781°N, 78.4802°E with embankment structure and spillway gates.
4. **Reservoir Surface**: Tehri Reservoir water body at Full Reservoir Level (EL 830m MSL).
5. **Downstream River Channel**: Bhagirathi Valley downstream gorge.
6. **Flood Water Surface**: Dynamic water surface mesh derived cell-by-cell from 2D `SimulationFrame` outputs ($WSE = z_{dem} + depth$).
7. **Infrastructure from GIS**: Critical infrastructure (Hospitals, Substations, Command Center, Power Plant).
8. **Bridges**: Real bridge structures (Tehri Suspension Bridge, Koti Crossing).
9. **Roads**: Highway corridors (NH-34 Tehri - Rishikesh).
10. **Terrain Contours / Elevation**: Isochrone contour wireframes and height-based shading.
11. **Simulation Time**: Real simulation time step ($T + 0m$ to $T + 360m$).
12. **Flood Depth**: Quantitative depth matrix visualization.
13. **Velocity Visualization**: 3D velocity field stream vectors.

## Decorative Element Removal Policy

All procedural and non-authoritative decorative elements have been explicitly removed:
- Fake green terrain $\rightarrow$ replaced by real DEM elevation mesh.
- Arbitrary water strips $\rightarrow$ replaced by 2D hydrodynamic solver water surface mesh.
- Floating labels $\rightarrow$ replaced by georeferenced badges anchored to exact world coordinates.
- Arbitrary bridge & road placement $\rightarrow$ replaced by georeferenced GIS vector alignments.
- Procedural mountains $\rightarrow$ replaced by ALOS PALSAR DEM topography.

## Georeferenced Asset Metadata Standard

Every 3D asset carries full georeferenced metadata:
- `latitude` / `lat`
- `longitude` / `lng`
- `elevation` / `elevation_m`
- `source` (e.g. `THDC Official Baseline`, `NRSC GIS`, `Uttarakhand PWD`)
- `provenance` (`REAL` vs `DEMO`)
- `asset_id` / `id`

## 2D $\leftrightarrow$ 3D Selection Synchronization

Bidirectional real-time synchronization is maintained between 2D Leaflet GIS map and 3D Digital Twin via `Map3DSynchronizationService`:
- **2D Click**: Selecting a location or asset on 2D map pans 3D camera to exact location and highlights feature.
- **3D Click**: Selecting a structure in 3D scene centers 2D GIS map view and opens inspection popup.

## Dynamic Parameter Responsiveness

Modifying any scenario inputs (Reservoir Level, Breach Width, Formation Time, Rainfall Scenario, Roughness, Hydraulic Model, Simulation Timestep) re-calculates the 2D `SimulationFrame` and automatically updates the 3D Digital Twin scene.
