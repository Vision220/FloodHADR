# PHASE 10 — HEC-RAS 2D HYDRAULIC MODEL

## Executive Summary

Phase 10 establishes a comprehensive, scientifically rigorous 2D HEC-RAS Hydraulic Model architecture within FloodHADR. This model constructs complete geometry files (`.g01`), 2D flow area definitions, computational meshes with resolution presets, structural breaklines, hydrodynamic refinement regions, spatially variable Manning's $n$ roughness zones, boundary conditions, reservoir initial conditions, and dam breach configurations.

The system supports both **Full Shallow Water Equations (SWE)** and **Diffusion Wave Equations (DWE)** solvers, allowing users to balance computational efficiency against momentum-dominated hydrodynamic accuracy.

---

## Key Features & Model Components

### 1. Model Components Checklist

The 2D HEC-RAS model generator explicitly populates 11 core hydrodynamic and geometric components:

| Component | Description | HEC-RAS File / Feature |
| :--- | :--- | :--- |
| **Terrain** | High-resolution DEM raster derived from authoritative sources | `.hdf` / `.tif` Terrain Layer |
| **2D Flow Area** | Bounding polygon defining the 2D computational domain | `2D Area Name=Tehri_Downstream_Domain` |
| **Computational Mesh** | Structured/Unstructured grid with explicit cell dimensions | Cell center coordinates & edge connectivity |
| **Breaklines** | Terrain alignment lines (thalweg, canyon ridges) enforcing edge alignment | `Breakline Name=Bhagirathi_Main_Channel_Thalweg` |
| **Refinement Regions** | High-density grid zones around steep gradients (dam toe, confluences) | `Refinement Region Name=Dam_Toe_High_Gradient_Zone` |
| **Manning's $n$** | Spatially distributed hydraulic surface roughness | Channel ($0.035$), Floodplain ($0.065$), Steep Bed ($0.080$) |
| **Upstream BC** | Inflow hydrograph from Tehri Reservoir dam breach flow | `BC Type=Hydrograph` |
| **Downstream BC** | Outflow condition at domain exit | `BC Type=Normal Depth` ($S_0 = 0.005$) |
| **Reservoir Condition** | Initial reservoir surface elevation | $H_0 = 830.0\,\text{m}$ (FRL) |
| **Dam Connection** | 2D Area Connection representing Tehri Dam structure | Crest EL $839.5\,\text{m}$, Length $575\,\text{m}$ |
| **Breach Configuration** | Hydrodynamic breach parameters (width, formation time, geometry) | Froehlich/MacDonald-Langridge breach progression |

---

## Computational Mesh Options & Resolution Trade-offs

FloodHADR provides three standardized mesh resolution presets.

### Mesh Presets Matrix

| Preset | Grid Size ($dx \times dy$) | Cell Count (Approx) | Recommended Timestep ($\Delta t$) | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **COARSE** | $50\,\text{m} \times 50\,\text{m}$ | $225$ cells | $5.0\,\text{s}$ | Rapid screening, parameter sensitivity sweeps, quick HADR planning |
| **MEDIUM** | $25\,\text{m} \times 25\,\text{m}$ | $900$ cells | $2.0\,\text{s}$ | Standard engineering assessments, 2D GIS rendering |
| **FINE** | $10\,\text{m} \times 10\,\text{m}$ | $5,625$ cells | $0.5\,\text{s}$ | High-fidelity dam breach wave front tracking, local structural impact |

### Scientific Disclosure: Fine Mesh Accuracy Trade-Offs

> [!WARNING]
> **Fine mesh resolution does NOT automatically guarantee higher hydraulic accuracy.**
> 
> While finer spatial discretization ($10\,\text{m}$) reduces spatial truncation errors, it presents key numerical trade-offs:
> 1. **CFL Constraint & Numerical Stability:** Fine meshes require significantly smaller computational timesteps ($\Delta t = 0.5\,\text{s}$) to maintain Courant-Friedrichs-Lewy (CFL) stability ($C = u \frac{\Delta t}{\Delta x} \le 1.0$). Operating a fine mesh with an unadjusted timestep leads to numerical instability and unphysical oscillations.
> 2. **Sub-Grid Terrain Filtering:** HEC-RAS utilizes high-resolution sub-grid terrain geometry (elevation-volume relationships per cell face). Fine grids with poorly sampled Manning's $n$ or uncalibrated bed roughness can introduce spurious numerical diffusion or excessive local resistance.
> 3. **Computational Cost:** Grid cell count scales quadratically ($O(N^2)$), increasing runtimes by up to 25x without proportional improvements in peak stage prediction if boundary friction dominates.

---

## Governing Equations: SWE vs DWE

FloodHADR allows selecting between two governing equation sets in HEC-RAS 2D:

### 1. HEC-RAS Shallow Water Equations (SWE / Full Momentum)

$$\frac{\partial u}{\partial t} + u \frac{\partial u}{\partial x} + v \frac{\partial u}{\partial y} = -g \frac{\partial z_w}{\partial x} - \frac{\tau_{bx}}{\rho h} + \nu \left( \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} \right)$$

- **Includes:** Advective acceleration terms, pressure gradients, turbulence viscosity, and bed shear stress.
- **Best suited for:** Rapid dam-break wave fronts, sharp channel bends, shock waves, dynamic wave reflection around structures.

### 2. HEC-RAS Diffusion Wave Equation (DWE)

$$-\nabla z_w = \frac{n^2 |\mathbf{u}| \mathbf{u}}{h^{4/3}}$$

- **Includes:** Bed slope and water pressure gradient balanced by bed friction; neglects acceleration terms.
- **Best suited for:** Moderately sloped floodplains, steady or slow-varying flood propagation, fast computational execution.

---

## Computational Features: Breaklines & Refinement Regions

### Structural Breaklines

Breaklines align computational cell faces along key topographics to prevent hydraulic short-circuiting across high terrain ridges or river channel banks:
- **`Bhagirathi_Main_Channel_Thalweg`**: Enforces cell face alignment along the primary river thalweg line.
- **`Right_Canyon_Wall_Ridge`**: Prevents flow leaking across steep right canyon cliffs.
- **`Left_Canyon_Wall_Ridge`**: Prevents flow leaking across steep left canyon cliffs.

### Hydrodynamic Refinement Regions

Refinement regions dynamically increase mesh density in critical hydrodynamic zones:
- **`Dam_Toe_High_Gradient_Zone`**: $5\,\text{m}$ grid refinement immediately downstream of Tehri Dam toe to capture supercritical flow transition.
- **`Koti_Nala_Confluence_Zone`**: $10\,\text{m}$ grid refinement at key tributary confluences to resolve complex wave interference.

---

## Metadata Recording & Provenance Payload

Every 2D HEC-RAS model configuration generates a comprehensive metadata record adhering to the `SimulationRun` metadata schema:

```json
{
  "model_type": "HEC-RAS 2D Hydraulic Model",
  "mesh_preset": "MEDIUM",
  "mesh_size_m": 25.0,
  "cell_count": 900,
  "breaklines": [
    "Bhagirathi_Main_Channel_Thalweg",
    "Right_Canyon_Wall_Ridge",
    "Left_Canyon_Wall_Ridge"
  ],
  "refinement_regions": [
    "Dam_Toe_High_Gradient_Zone",
    "Koti_Nala_Confluence_Zone"
  ],
  "timestep_s": 2.0,
  "solver": "HEC-RAS SWE",
  "boundary_conditions": {
    "upstream": "Dam Breach Inflow Hydrograph",
    "downstream": "Normal Depth (Slope=0.005)"
  },
  "accuracy_notice": "Fine mesh resolution does not automatically guarantee higher accuracy. Smaller grid sizes require smaller timesteps for CFL stability and can be sensitive to uncalibrated Manning's n."
}
```

---

## REST API Integration

The HEC-RAS 2D solver architecture is accessible via FastAPI endpoints:

- `GET /api/v1/hecras/2d/presets`: Retrieves available mesh presets (`COARSE`, `MEDIUM`, `FINE`) and detailed scientific trade-off descriptions.
- `POST /api/v1/hecras/2d/generate-model`: Constructs complete HEC-RAS 2D model files (`.prj`, `.g01`, `.p01`, `.b01`) with explicit mesh, breakline, boundary, and solver parameters.
- `POST /api/v1/hecras/2d/simulate`: Executes the generated 2D HEC-RAS model or returns validated fallback execution status with zero-data fabrication.

---

## Verification & Unit Testing

The Phase 10 suite (`backend/test_phase10_hec_ras_2d_model.py`) validates:
1. All three mesh resolution presets (`COARSE`, `MEDIUM`, `FINE`) generate correct grid cell counts and timestep recommendations.
2. Structural breaklines and refinement regions are properly defined and registered.
3. Both `SWE` and `DWE` solver selection options generate valid model parameters.
4. Complete metadata payloads record all 7 required attributes (`mesh_size`, `cell_count`, `breaklines`, `refinement_regions`, `timestep`, `solver`, `boundary_conditions`).
5. REST API endpoints respond accurately with non-fabricated results.
