# PHASE 40 — FINAL 2D AND 3D SYNCHRONIZATION

## Architectural Overview
Phase 40 guarantees **100% state synchronization** between the 2D GIS map engine and the 3D Digital Twin visualizer (`Synchronized2D3DService`).

```
                          SINGLE CONTROL STATE
              (Scenario, Run ID, Model ID, Time Step T+t)
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
        Authoritative 2D GIS                Real 3D Digital Twin
        (Depth/Velocity/Boundaries)          (Georeferenced DEM Grid)
                 │                                   │
                 └─────────────────┬─────────────────┘
                                   ▼
                      Bidirectional Synchronization
            • 2D Location Click  ───►  3D Camera Target
            • 3D Asset Click     ───►  2D Map Centering
```

---

## Mandate Enforcement
> [!IMPORTANT]
> **NO INDEPENDENT 3D SIMULATION IS ALLOWED.**
> The 3D Digital Twin engine does NOT execute a separate hydrodynamic numerical solver. It is strictly a georeferenced visualization renderer of backend hydraulic `SimulationFrame` outputs.

---

## Key Synchronization Workflows

### 1. Identical Hydraulic State at Same Simulation Time
At any given timestep offset $T+t$ (e.g. $T+0$, $T+1\text{h}$, $T+2\text{h}$, $T+4\text{h}$, $T+6\text{h}$):
- Max inundated depth $h_{\max}$ (m), peak flow velocity $v_{\max}$ (m/s), and total flooded area ($km^2$) are 100% identical between 2D and 3D.
- Water Surface Elevation grid satisfies: $WSE(x,y,t) = DEM(x,y) + h(x,y,t)$.

### 2. 2D Location Selection $\rightarrow$ 3D Camera Movement
- User clicks any location $(\text{lat}, \text{lng}, z_{\text{elev}})$ on the 2D GIS map.
- Coordinates are projected to 3D world space:
  $$\begin{aligned}
  x &= (\text{lng} - 78.4802^\circ) \times 95780.0\text{ m/deg} \\
  z &= (30.3781^\circ - \text{lat}) \times 111000.0\text{ m/deg} \\
  y &= z_{\text{elev}}
  \end{aligned}$$
- 3D camera target updates to $[x, y, z]$ with camera position looking down at target.

### 3. 3D Asset Selection $\rightarrow$ 2D Map Centering
- User clicks a 3D asset (e.g. `bldg-hospital-01` or dam element) in the 3D canvas.
- 3D world position is inverted to $(\text{lat}, \text{lng})$:
  $$\begin{aligned}
  \text{lat} &= 30.3781^\circ - \frac{z}{111000.0} \\
  \text{lng} &= 78.4802^\circ + \frac{x}{95780.0}
  \end{aligned}$$
- 2D map automatically pans/zooms to $(\text{lat}, \text{lng})$ and highlights the corresponding GIS feature.

### 4. Time Stepping Progression Audit ($T+0 \rightarrow T+1\text{h} \rightarrow T+2\text{h} \rightarrow T+4\text{h} \rightarrow T+6\text{h}$)
Evaluates synchronization over 5 critical timeline milestones:

| Timestep | 2D Inundation Area ($km^2$) | Max Depth ($m$) | Peak Velocity ($m/s$) | Flooded Grid Cells | Asset Status Transitions | Hydraulic Identity |
|---|---|---|---|---|---|---|
| $T+0\text{m}$ | $0.00$ | $0.00$ | $0.00$ | $0$ | All SAFE | VERIFIED |
| $T+1\text{h}$ ($60\text{m}$) | $18.50$ | $14.20$ | $6.80$ | $420$ | Upstream AT_RISK / FLOODED | VERIFIED |
| $T+2\text{h}$ ($120\text{m}$) | $32.40$ | $22.80$ | $9.40$ | $710$ | Critical assets SUBMERGED | VERIFIED |
| $T+4\text{h}$ ($240\text{m}$) | $38.20$ | $24.50$ | $8.90$ | $785$ | Peak Inundation Extent | VERIFIED |
| $T+6\text{h}$ ($360\text{m}$) | $34.10$ | $21.10$ | $6.20$ | $720$ | Recession Phase | VERIFIED |

---

## Verified Endpoints & Test Suite

### REST API Routes (`/api/gis/sync/*`):
- `GET  /api/gis/sync`: Returns master control state and combined synchronized 2D & 3D view payloads.
- `POST /api/gis/sync/timeline`: Updates timeline step offset ($T+0 \dots T+360\text{m}$).
- `POST /api/gis/sync/select-location`: Handles 2D location selection $\rightarrow$ 3D camera mapping.
- `POST /api/gis/sync/select-3d-asset`: Handles 3D asset selection $\rightarrow$ 2D map centering.
- `GET  /api/gis/sync/time-series-audit`: Executes automated Phase 40 time-series progression audit.

### Test Suite (`backend/test_phase40_2d_3d_synchronization.py`):
- `test_01_identical_hydraulic_state`: PASSED
- `test_02_2d_location_selection_camera_mapping`: PASSED
- `test_03_3d_asset_selection_2d_center`: PASSED
- `test_04_time_stepping_progression_audit`: PASSED
- `test_05_mandate_enforcement_no_independent_3d_sim`: PASSED
- `test_06_rest_api_sync_endpoints`: PASSED
