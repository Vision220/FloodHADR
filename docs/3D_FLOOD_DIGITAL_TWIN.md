# FLOODHADR — 3D FLOOD DIGITAL TWIN ARCHITECTURE & TECHNICAL SPECIFICATION

**Module Route**: `/3d-flood-twin`  
**Platform**: FloodHADR (Dam-Break, Flash-Flood Simulation & HADR Decision Support System)  
**Problem Statement ID**: NTRO PS ID 26161  
**Target Basin**: Tehri Hydroelectric Complex & Bhagirathi River Gorge (Uttarakhand, India)

---

## 1. ARCHITECTURE & MODULE OVERVIEW

The **3D Flood Digital Twin** module provides geospatial 3D reconstruction and time-dependent hydrodynamic flood propagation playback for the Tehri Hydroelectric Complex and Bhagirathi River Basin.

It connects live hazard inputs (rainfall intensity, SCS-CN, Tehri reservoir pool level, dam breach dimensions, tributary inflow regimes, CMIP6 climate scaling, landslide river blockage) to dynamic 3D WebGL terrain, water depth surface elevation, flow velocity vectors, and infrastructure exposure tracking.

### Core Architecture Diagram:
```
                                +-------------------------+
                                |  Hazard Inputs Sliders  |
                                | (Rain, Dam, Tributary)  |
                                +------------+------------+
                                             |
                                             v
                                +-------------------------+
                                |   DigitalTwinEngine     |
                                | (Physics Frame Builder) |
                                +------------+------------+
                                             |
                                             v
                                +-------------------------+
                                |     Flood3DState        |
                                |  (Central 3D State)     |
                                +------+-----------+------+
                                       |           |
            +--------------------------+           +--------------------------+
            |                                                                 |
            v                                                                 v
+-----------------------+                                         +-----------------------+
|  DigitalTwinCanvas    |                                         |     GISMapModule      |
| (3D Three.js Scene)   | <============== SYNC =================> |  (2D Leaflet Canvas)  |
+-----------------------+                                         +-----------------------+
```

---

## 2. DATA FLOW & SIMULATION FRAME SCHEMAS

### Central State: `Flood3DState`
```typescript
export interface Flood3DState {
  scenarioId: string;
  scenarioName: string;
  temporalMode: 'PAST' | 'PRESENT' | 'NEXT' | 'FUTURE' | 'EXTREME';
  rainfallMm: number;
  rainfallIntensityMmHr: number;
  cumulativeRainfallMm: number;
  reservoirLevelM: number;
  reservoirStorageMm3: number;
  damBreachWidthM: number;
  breachFormationTimeMin: number;
  tributaryDischargeM3s: number;
  riverDischargeM3s: number;
  manningsN: number;
  climateScaling: number;
  landslideBlockage: 'NONE' | 'PARTIAL' | 'MAJOR_BLOCKAGE';
  
  playbackSpeed: number; // 0.25x to 16x
  isPlaying: boolean;
  currentTimeMin: number;
  totalDurationMin: number;
  
  verticalExaggeration: number; // 0.5x, 1x, 2x, 3x, 5x
  layerMode: 'DEPTH' | 'VELOCITY' | 'INUNDATION' | 'ARRIVAL_TIME';
  mapStyle: 'STREET' | 'SATELLITE' | 'HYBRID' | 'TERRAIN';
  layoutView: '2D_ONLY' | '3D_ONLY' | 'SPLIT_VIEW';
  
  currentFrame: SimulationFrame;
  provenance: DataProvenance;
}
```

### Standardized Simulation Frame: `SimulationFrame`
```typescript
export interface SimulationFrame {
  timeSec: number;
  timeDisplay: string;
  progressPercent: number;
  waterDepthMatrix: number[][];
  waterSurfaceElevationMatrix: number[][];
  velocityMatrix: number[][];
  flowDirectionMatrix: number[][];
  inundationMask: boolean[][];
  arrivalTimeMatrix: number[][];
  floodedAreaKm2: number;
  maxDepthM: number;
  maxVelocityMs: number;
  peakDischargeM3s: number;
  affectedAssetsCount: number;
  breachProgressPercent: number;
}
```

---

## 3. MAP PROVIDER ABSTRACTION (`MapProviderService`)

Basemap selection is decoupled via the `MapProviderService` abstraction:

| Map Style | Provider | URL Template | Notice & Status |
| :--- | :--- | :--- | :--- |
| **STREET** | OpenStreetMap Carto | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | OPEN ACCESS TILE SERVICE ACTIVE |
| **SATELLITE** | ESRI World Imagery | `https://server.arcgisonline.com/.../MapServer/tile/{z}/{y}/{x}` | HIGH-RESOLUTION SATELLITE EO FEED |
| **HYBRID** | ESRI Satellite + Overlay | `https://server.arcgisonline.com/.../MapServer/tile/{z}/{y}/{x}` | HYBRID SATELLITE & INFRASTRUCTURE OVERLAY |
| **TERRAIN** | USGS OpenTopoMap | `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png` | DEM CONTOUR & TOPOGRAPHIC TERRAIN |

---

## 4. KEY 3D DIGITAL TWIN FEATURES

1. **Vertical Terrain Exaggeration**:
   - Selector for `0.5x`, `1x`, `2x`, `3x`, and `5x` elevation mesh scaling to emphasize steep Himalayan river gorges.
2. **Dynamic 3D Flood Water Shader**:
   - Water surface height dynamically calculated as $Z_{\text{water}} = Z_{\text{terrain}} + d_{\text{simulated}}$.
   - Multi-spectrum color mapping:
     - `0 – 0.5 m`: Shallow Cyan (`#22d3ee`)
     - `0.5 – 1 m`: Blue (`#0284c7`)
     - `1 – 2 m`: Deep Blue (`#0369a1`)
     - `2 – 5 m`: Midnight Blue (`#1e3a8a`)
     - `5 – 10 m`: Indigo (`#312e81`)
     - `> 10 m`: Deep Purple (`#4c1d95`)
3. **Atmospheric 3D Rain Particle System**:
   - Particle density dynamically scaled to input rainfall intensity ($30\text{ mm} \rightarrow 450\text{ mm}$).
4. **Synchronized 2D + 3D View Modes**:
   - `2D GIS MAP`: Fullscreen Leaflet GIS view.
   - `3D TWIN`: Fullscreen WebGL Three.js Digital Twin.
   - `SPLIT VIEW`: Synchronized side-by-side view sharing time scrubber, inputs, and asset selection.
5. **Interactive Hydraulic Cross-Section Profile Tool**:
   - Generates transverse elevation profiles comparing bed elevation vs water surface elevation.
6. **Location & Asset Inspection Drawer**:
   - Displays Lat, Lng, Elevation, Water Depth, Velocity, Flow Direction, Arrival Time, Nearest Channel, and Data Provenance badge (`OBSERVED`, `SIMULATED`, `FORECAST`, `DERIVED`, `DEMO`, `SYNTHETIC`, `EXPERIMENTAL`).

---

## 5. PERFORMANCE STRATEGY & MEMOIZATION

- **FPS Target**: 60 FPS continuous rendering.
- **Separation of Simulation & Render Loops**: `requestAnimationFrame` decouples physical frame interpolation from React state re-renders.
- **Geometry Reuse & Memoization**: `PlaneGeometry` vertex height arrays are updated in-place via `Float32Array` attributes rather than destroying/re-creating Three.js meshes.
- **Instancing & Frustum Culling**: Applied for vegetation and recurring infrastructure assets.

---

## 6. SYSTEM VERIFICATION & TESTING

- **TypeScript Verification**: Built clean (`dist/` generated with 0 type errors).
- **Backend API Integration**: 12 backend test suites passed 100%.
- **Existing Features Preserved**: `CommandCenterPage`, `DashboardPage`, `Simulation3DPage`, and all 14 scientific modules remain 100% operational.

---

## 7. STARTUP COMMANDS AND LOCAL URLS

### Backend Startup Command:
```bash
cd backend
venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### Frontend Startup Command:
```bash
cd frontend
npm run dev
```

### Application URLs:
- **3D Flood Digital Twin Route**: [`http://localhost:5173/`](http://localhost:5173/) (Select **"3D Flood Digital Twin"** in sidebar or top bar)
- **Direct Frontend URL**: [`http://localhost:5173`](http://localhost:5173)
- **Backend API URL**: [`http://localhost:8000`](http://localhost:8000)
