# FLOODHADR — GEOREFERENCED 3D DIGITAL TWIN ARCHITECTURE SPECIFICATION

## 1. Executive Summary
This document defines the authoritative architecture for the **FloodHADR Georeferenced 3D Digital Twin**.
The 3D model is explicitly designed as a **geospatial digital twin**, operating on identical geographic coordinates, Digital Elevation Models (DEM), remote-sensing layers (Google Earth Engine), and hydrodynamic simulation outputs as the 2D GIS map.

```
                  AUTHORITATIVE REAL GEOGRAPHY
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
  2D GIS MAP                                   3D DIGITAL TWIN
  (Leaflet / Google Satellite)                  (Three.js / WebGL)
       │                                               │
       └───────────────────────┬───────────────────────┘
                               ▼
                SINGLE GEOGRAPHIC REFERENCE STATE
              (WGS84 EPSG:4326 | Lat, Lng, Elevation)
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
  REAL DEM TERRAIN        GIS INFRASTRUCTURE     HYDRODYNAMIC SOLVER
  (12m ALOS PALSAR)      (Real Coordinates)    (Diffusive Wave Core)
```

---

## 2. Core Architectural Principles

1. **Single Source of Truth**: A unified `GeoReferenceState` governs both 2D Leaflet GIS rendering and 3D Three.js scene coordinates.
2. **Deterministic Coordinate Conversion**:
   - $\text{Lat/Lng/Elev} \longleftrightarrow \text{Cartesian } (X, Y, Z)$ using origin $(78.4802^\circ \text{E}, 30.3781^\circ \text{N}, 830\text{m MSL})$.
3. **No Frontend Physics Fabrication**: The 3D view acts purely as a visualization client consuming authoritative `SimulationFrame` outputs calculated by the backend hydrodynamic core.
4. **Data Provenance Integrity**: Every element displays explicit provenance tags (`REAL GIS`, `OBSERVED`, `SIMULATED`, `DERIVED`, `FORECAST`, `SYNTHETIC`, `DEMO`, `EXPERIMENTAL`).

---

## 3. GeoReferenceState Specification

```typescript
export interface GeoReferenceState {
  crs: 'EPSG:4326';
  originLat: 30.3781;
  originLng: 78.4802;
  elevationDatum: 'MSL (Mean Sea Level)';
  boundingBox: [78.42, 30.32, 78.58, 30.45]; // [minLng, minLat, maxLng, maxLat]
  terrainResolutionM: 12.0;
  mapScale: 1.0;
  verticalScale: 1.0 | 2.0 | 3.0;
}
```

---

## 4. Map ↔ 3D Synchronization Service Architecture

```
 User Action (2D Map Click) ──► GeoReference Coordinate ──► 3D Camera Smooth Lerp ──► Highlight 3D Mesh
 User Action (3D Mesh Click) ──► Lat/Lng Calculation ──► 2D Map Center Pan & Zoom ──► Object Inspector
```

---

## 5. Satellite & GEE Observed vs Hydrodynamic Simulated Flood Comparison

- **Mode 1 (Simulated)**: Hydrodynamic 2D diffusive-wave depth matrix rendered on 3D terrain surface.
- **Mode 2 (Observed)**: GEE Sentinel-1 SAR backscatter thresholded flood extent overlay.
- **Mode 3 (Comparison)**: Spatial Intersection-over-Union (IoU) rendering overlapping, false-positive, and false-negative flood zones.

---

## 6. Verification & Quality Control

- **Alignment Debug Tool**: `[CHECK 2D ↔ 3D ALIGNMENT]` verifying CRS, Bounding Box, Origin, Scale, and Elevation Datum.
- **Performance Budget**: Target 60 FPS using static LOD terrain memoization and dynamic vertex displacement buffers.
