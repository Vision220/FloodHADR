# PHASE 27 — REAL FLOODHADR SWE / DWE COMPUTATION ENGINE

## Executive Summary & Engineering Framework
Phase 27 establishes the authoritative 2D finite-volume hydrodynamic solver framework for **FloodHADR**. It introduces two explicit, mathematically rigorous solver modes:
1. **`FloodHADR SWE`**: Conservative 2D Shallow Water Equations (Full Saint-Venant momentum & continuity).
2. **`FloodHADR DWE`**: 2D Diffusive Wave Equation (Pressure gradient & friction equilibrium approximation).

---

## 1. Mathematical Formulation

### Mode A: `FloodHADR SWE` (2D Shallow Water Equations)

The conservative 2D Shallow Water Equations are solved using a 2D finite-volume upwind scheme:

$$\frac{\partial \mathbf{U}}{\partial t} + \frac{\partial \mathbf{F}(\mathbf{U})}{\partial x} + \frac{\partial \mathbf{G}(\mathbf{U})}{\partial y} = \mathbf{S}_0(\mathbf{U}) + \mathbf{S}_f(\mathbf{U})$$

where:

$$\mathbf{U} = \begin{pmatrix} h \\ hu \\ hv \end{pmatrix}, \quad 
\mathbf{F} = \begin{pmatrix} hu \\ hu^2 + \frac{1}{2}gh^2 \\ huv \end{pmatrix}, \quad 
\mathbf{G} = \begin{pmatrix} hv \\ huv \\ hv^2 + \frac{1}{2}gh^2 \end{pmatrix}$$

$$\mathbf{S}_0 = \begin{pmatrix} Q_{\text{breach}} / A_{\text{cell}} \\ -gh \frac{\partial Z}{\partial x} \\ -gh \frac{\partial Z}{\partial y} \end{pmatrix}, \quad
\mathbf{S}_f = \begin{pmatrix} 0 \\ -\frac{g n^2 u \sqrt{u^2 + v^2}}{h^{4/3}} \\ -\frac{g n^2 v \sqrt{u^2 + v^2}}{h^{4/3}} \end{pmatrix}$$

---

### Mode B: `FloodHADR DWE` (2D Diffusive Wave Equation)

In DWE mode, inertial terms ($\frac{\partial \mathbf{u}}{\partial t}, \mathbf{u}\cdot\nabla\mathbf{u}$) are neglected, balancing the pressure gradient with friction slope:

$$\nabla (Z + h) + \mathbf{S}_f = 0$$

The directional velocity vector $\mathbf{u} = (u, v)$ is computed directly via the Manning-Strickler equation:

$$\mathbf{u} = -\frac{1}{n} h^{2/3} \frac{\nabla (Z + h)}{\sqrt{|\nabla (Z + h)|}}$$

---

## 2. Required Simulation Output Payload (11 Output Fields)

Every simulation run generates a structured payload containing:

| Output Field | Key Name | Unit | Description |
| :--- | :--- | :--- | :--- |
| **Simulation Time** | `time_sec` | s | Current simulation duration timestamp |
| **Water Depth** | `water_depth` ($h$) | m | 2D matrix of cell water depths |
| **Velocity X** | `velocity_x` ($u$) | m/s | 2D matrix of eastward velocity components |
| **Velocity Y** | `velocity_y` ($v$) | m/s | 2D matrix of northward velocity components |
| **Velocity Magnitude** | `velocity` ($V$) | m/s | 2D matrix of velocity magnitudes ($\sqrt{u^2 + v^2}$) |
| **Water Surface Elev.** | `water_surface_elevation` | m MSL | $WSE(y,x) = Z_{\text{dem}}(y,x) + h(y,x)$ |
| **Wet/Dry Mask** | `flooded_mask` | binary | $1$ if $h \ge 0.005\,\text{m}$, else $0$ |
| **Flood Extent** | `flooded_area_km2` | km² | Total contiguous inundated area |
| **Arrival Time** | `arrival_time_sec` | s | Timestamp when cell first exceeded $h \ge 0.005\,\text{m}$ |
| **Duration** | `flood_duration_sec` | s | Cumulative time cell remained inundated |
| **Virtual Gauges** | `virtual_gauge_hydrographs` | m, m/s, m³/s | Discharge and depth hydrographs at 4 key stations |

---

## 3. Metadata Header & Numerical Diagnostics Panel

### Metadata Header Structure
* **Model Designation**: `MODEL: FloodHADR SWE` or `MODEL: FloodHADR DWE`
* **Run ID**: Unique run identifier (e.g. `run-swe-1768402941`)
* **Scenario ID**: `scen-tehri-pmf-001`
* **Timestep ($\Delta t$)**: Adaptive timestep in seconds ($0.2\,\text{s} \dots 5.0\,\text{s}$)
* **Grid Resolution**: $25\,\text{m} \times 25\,\text{m}$ (or custom DEM resolution)
* **DEM Source**: $12.5\,\text{m}$ ALOS PALSAR DEM
* **Roughness**: Manning's $n = 0.035$
* **Boundary Condition**: `OPEN_OUTFLOW` | `REFLECTIVE_WALL`
* **Provenance**: `SIMULATED_2D_SWE` | `SIMULATED_2D_DWE`

### Numerical Diagnostics & Validity Checks

$$\text{CFL} = \max_{(i,j)} \left( \frac{(|u_{i,j}| + \sqrt{g h_{i,j}})\Delta t}{\Delta x}, \frac{(|v_{i,j}| + \sqrt{g h_{i,j}})\Delta t}{\Delta y} \right) \le 0.45$$

$$\text{Mass Balance Error (\%)} = \frac{|\text{Volume}_{\text{current}} - (\text{Volume}_{\text{inflow}} - \text{Volume}_{\text{outflow}})|}{\text{Volume}_{\text{inflow}}} \times 100 \le 0.05\%$$

* **Validity Criteria**: A simulation run is flagged as `INVALID` if:
  1. `nan_count > 0`
  2. `inf_count > 0`
  3. `mass_balance_error_percent > 0.05%`

---

## 4. Deliverables & Verification

1. **Documentation**: Created [`docs/PHASE_27_SWE_DWE_ENGINE.md`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/docs/PHASE_27_SWE_DWE_ENGINE.md).
2. **Hydrodynamic Solver Engine**: Updated [`backend/app/simulation/hydrodynamic_2d_solver.py`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/backend/app/simulation/hydrodynamic_2d_solver.py).
3. **Automated Unit Tests**: Created [`backend/test_phase27_swe_dwe_engine.py`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/backend/test_phase27_swe_dwe_engine.py) (`Ran 4 tests in 0.237s - OK`).
