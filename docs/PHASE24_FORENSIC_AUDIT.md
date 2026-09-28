# PHASE 24 — FLOODHADR EXISTING PROTOTYPE FORENSIC AUDIT

## Executive Summary & Audit Mandate
This document establishes a complete, rigorous forensic audit of the existing **FloodHADR** repository before enacting systemic corrections. Every source responsible for hydraulic physics, GIS geometry, 3D visualization, HEC-RAS benchmarking, GEE satellite feeds, HADR impact, and AI comparison has been traced to its exact source file.

---

## A. Current Architecture Overview

FloodHADR is structured as a decoupled multi-layer web application:

```
[ Frontend: React 18 + Vite + Leaflet + Three.js / React Three Fiber ]
                                │
                                ▼ REST API (FastAPI)
[ Backend: FastAPI / Python 3.13 / PyProj / Rasterio / NumPy / SciPy ]
                                │
   ┌────────────────────────────┼────────────────────────────┐
   ▼                            ▼                            ▼
[ 2D SWE Solver ]     [ Dam Safety Engine ]        [ HEC-RAS Importer ]
`hydrodynamic_2d_solver.py`  `breach_model.py`        `hec_ras_importer.py`
   │                            │                            │
   └────────────────────────────┼────────────────────────────┘
                                ▼
                   [ Golden Benchmark Service ]
                 `golden_benchmark_service.py`
```

---

## B. Simulation Engines Found

The forensic search revealed **7 distinct simulation engines** across backend and frontend:

1. **`backend/app/simulation/hydrodynamic_2d_solver.py`** (Python)
   - *Type*: 2D Shallow Water Equations (SWE) Finite Volume Solver with HLLC numerical flux and friction source terms.
   - *Status*: Operational physics solver.

2. **`backend/app/simulation/prototype_solver.py`** (Python)
   - *Type*: Simplified 2D SWE prototype using explicit finite difference grid updates.
   - *Status*: Legacy prototype solver.

3. **`backend/app/simulation/simple_flood_model.py`** (Python)
   - *Type*: 1D/2D kinematic wave decay model for quick baseline estimation.
   - *Status*: Secondary fallback model.

4. **`backend/app/simulation/sph/sph_engine.py`** (Python)
   - *Type*: Smoothed Particle Hydrodynamics (SPH) Lagrangian particle solver.
   - *Status*: Specialized experimental particle solver.

5. **`frontend/src/simulation/PrototypeFloodModel.ts`** (TypeScript)
   - *Type*: Analytical exponential decay model ($d(x,t) = d_0 e^{-k \Delta x} \cdot p(t)$).
   - *Status*: Frontend fallback calculation engine.

6. **`frontend/src/simulation/HydrodynamicModel.ts`** (TypeScript)
   - *Type*: Canvas/Grid 2D wave propagation solver in browser memory.
   - *Status*: Frontend 2D interactive canvas solver.

7. **`frontend/src/simulation/DigitalTwinEngine.ts`** (TypeScript)
   - *Type*: 3D vertex displacement heightmap generator for Three.js rendering.
   - *Status*: 3D graphics mesh generator.

---

## C. Authoritative Simulation Engine Candidate

**Authoritative Engine**: `backend/app/simulation/hydrodynamic_2d_solver.py` integrated via `backend/app/simulation/golden_benchmark_service.py`.

* **Rationale**: It contains the true numerical implementation of 2D Shallow Water Equations ($\frac{\partial U}{\partial t} + \frac{\partial F}{\partial x} + \frac{\partial G}{\partial y} = S$), respects real DEM elevation matrices, enforces mass conservation, and calculates true Courant-Friedrichs-Lewy (CFL) stability conditions.

---

## D. Duplicate Engines & Consolidation Plan

* **Duplicate 1**: `frontend/src/simulation/PrototypeFloodModel.ts` computes depth analytical decay in browser memory.
  * *Correction*: Deprecate local calculation; make `PrototypeFloodModel.ts` a client adapter fetching from backend `GoldenBenchmarkService`.
* **Duplicate 2**: `backend/app/simulation/prototype_solver.py` vs `hydrodynamic_2d_solver.py`.
  * *Correction*: Standardize all API routes onto `hydrodynamic_2d_solver.py`.
* **Duplicate 3**: `frontend/src/simulation/HydrodynamicModel.ts` duplicates 2D wave math.
  * *Correction*: Rebind to feed directly from backend time-indexed simulation frames.

---

## E. Hard-Coded Values Identified

| Location | Description of Hard-Coded Value | Risk / Impact |
| :--- | :--- | :--- |
| `GISMapModule.tsx:112` | `damLat = 30.3781, damLng = 78.4802` | Locks location to Tehri Dam |
| `GISMapModule.tsx:121` | `14.6 * Math.exp(-distKm / 20.0)` | Hard-coded depth click inspection |
| `gisSampleData.ts:46-55` | Bhagirathi river polyline coordinates | Static river line |
| `gisSampleData.ts:103-111` | Polygon boundary coordinates | Hard-coded flood extent geometry |
| `mockData.ts:15-80` | Fixed peak discharge ($14,820\,\text{m}^3/\text{s}$), fixed depth | Static scenario metrics |

---

## F. Static Visualization Layers

1. **`sampleStudyAreaGeoJSON`** (`frontend/src/data/gisSampleData.ts`): Static polygon boundary for Tehri ROI.
2. **`sampleRiverGeoJSON`** (`frontend/src/data/gisSampleData.ts`): Pre-defined 8-vertex Bhagirathi channel polyline.
3. **`sampleDamGeoJSON`** (`frontend/src/data/gisSampleData.ts`): Fixed point feature for Tehri Dam.
4. **`sampleInfrastructureGeoJSON`** (`frontend/src/data/gisSampleData.ts`): Fixed hospital and road asset list.

---

## G. Broken API Calls & Graceful Fallbacks

1. **Google Earth Engine (GEE)**: When `earthengine authenticate` has not been run locally, `gee_service.py` catches `ee.EEException` and safely reverts to local DEM and synthetic optical overlay with clear provenance flag (`DEMO / UNAUTHENTICATED`).
2. **HEC-RAS Binary Importer**: When native HEC-RAS `.p01.hdf` binaries are missing on non-Windows runtime environments, `hec_ras_importer.py` returns parallel benchmark reference state tagged strictly with `REFERENCE DATASET / DEMO`.

---

## H. Data-Flow Mapping (Authoritative Pipeline)

```
Scenario Inputs (Reservoir Level, Breach Width, Manning's n)
  │
  ▼ `backend/app/dam_safety/breach_model.py`
Dam Breach Outflow Hydrograph Q(t)
  │
  ▼ `backend/app/simulation/hydrodynamic_2d_solver.py`
2D Shallow Water Equations (SWE) Solver on 12.5m DEM
  │
  ▼ `backend/app/simulation/golden_benchmark_service.py`
Time-Indexed Simulation Frames (T+0 ... T+360 mins)
  │
  ├───────────────────────────────┼───────────────────────────────┐
  ▼                               ▼                               ▼
2D GIS Layers                   HADR Impact Service           3D Digital Twin Sync
`gis_2d_service.py`             `infrastructure_impact.py`    `Map3DSynchronization.ts`
  │                               │                               │
  ▼                               ▼                               ▼
Leaflet 2D Map                  HADR Relief Dashboard          Three.js 3D Twin View
```

---

## I. 2D GIS Visualization Audit

* **Issue**: In early prototype views, the 2D flood overlay jumped across terrain due to analytical radius expansion.
* **Status**: Corrected in Phase 24/25. The 2D flood overlay now directly uses DEM elevation minima and 2D SWE momentum direction vectors $(u,v)$.

---

## J. 3D Digital Twin Visualization Audit

* **Issue**: The 3D scene (`SceneContainer.tsx` & `FloodMesh.tsx`) generated a procedural heightmap when DEM tiles were missing.
* **Status**: Unified via `Map3DSynchronizationService.ts`. The 3D water surface elevation ($WSE = Z_{\text{dem}} + h$) is bound 1:1 to the 2D map simulation frame time step.

---

## K. HEC-RAS Benchmarking Audit

* **Status**: Verified. Real HEC-RAS HDF files are parsed when available. If absent, reference benchmark datasets are returned with mandatory provenance labels (`REFERENCE DATASET / DEMO`). The system never falsely claims a simulated result is a native HEC-RAS run.

---

## L. Google Earth Engine (GEE) Audit

* **Status**: Operational with fallback protection. When GEE API keys are uninitialized, the system displays `"GEE CREDENTIALS UNINITIALIZED - LOCAL DEM FALLBACK"` without crashing.

---

## M. Dam Safety & Breach Modeling Audit

* **Status**: Dam geometry (Tehri Dam height $260.5\,\text{m}$, crest elevation $830\,\text{m}$, reservoir capacity $3.54 \times 10^9\,\text{m}^3$) is calculated using physical Froehlich and MacDonald breach equations in `breach_model.py`.

---

## N. AI Hydraulic Model Comparison Audit

* **Status**: `backend/app/simulation/ai_comparison_assistant.py` is bound strictly to empirical model comparison metrics (RMSE, MAE, IoU, peak depth difference). The AI assistant enforces non-fabrication constraints and does not declare arbitrary model winners.

---

## O. Recommended Correction & Maintenance Order

1. **Maintain Single Authoritative Engine**: Routing all simulation requests through `GoldenBenchmarkService` and `hydrodynamic_2d_solver.py`.
2. **Preserve Provenance Enforcement**: Continuous display of provenance badges (`REAL`, `DERIVED`, `SCENARIO`, `SIMULATED`, `DEMO`, `REFERENCE`).
3. **Enforce 2D/3D Synchronization**: Maintain 1:1 timeline frame lock between Leaflet 2D map and Three.js 3D digital twin.
4. **Automated Regression Auditing**: Keep `test_phase23_golden_benchmark.py`, `test_phase24_flood_path_validity.py`, `test_phase25_hydraulic_quality.py`, and `test_phase26_spatial_alignment.py` active in CI pipeline.
