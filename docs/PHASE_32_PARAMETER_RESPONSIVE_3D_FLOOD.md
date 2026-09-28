# Phase 32 Documentation: Parameter-Responsive 3D Flood Engine

## Architectural Overview

Phase 32 establishes strict parameter responsiveness across all 8 hydraulic variables. Modifying any parameter triggers a new scenario evaluation, generates new `SimulationFrame` time-series matrices, and updates all downstream visual and decision support modules.

```
SCENARIO PARAMETER INPUTS (8 Parameters)
  ├── Reservoir Level (m)
  ├── Breach Width (m)
  ├── Formation Time (hr)
  ├── Breach Elevation (m)
  ├── Manning's Roughness (n)
  ├── Rainfall / Inflow Scenario
  ├── Hydraulic Model (SWE / DWE)
  └── Simulation Duration (hr)
            ↓
    Unique Scenario ID (e.g. SCEN_R830_W180_TF1.5_E600_N035...)
            ↓
    2D / 3D Hydraulic Solver (`SimulationFrame`)
            ↓
  AUTOMATIC SYNCHRONIZED MULTI-MODULE UPDATES:
  ├── 2D GIS Map (Depth, Velocity, Isochrones, Flood Extent)
  ├── 3D Digital Twin (Terrain WSE Mesh, 3D Depth Matrix, 3D Velocity Stream Vectors)
  ├── HADR Impact Engine (Affected Population, Impassable Roads, Threatened Assets)
  ├── Virtual Gauges (Dam Toe, Koteshwar, Devprayag, Rishikesh Stage & Flow)
  ├── Hydrodynamic Statistics (Peak Q, Max Stage, Inundated Area)
  └── Scientific Reports (Automated PDF / Markdown Technical Reports)
```

## Tested 8 Hydraulic Parameters

| Parameter | Baseline Value | Scaling Physics & Formula | Module Impact |
| :--- | :--- | :--- | :--- |
| **1. Reservoir Level** | $830.0$ m MSL | Head $H_w = z_{\text{res}} - z_{\text{breach\_elev}}$. Discharge $Q \propto H_w^{1.25}$. | 2D, 3D, HADR, Gauges, Stats |
| **2. Breach Width** | $180.0$ m | Discharge $Q \propto B_w$. $300$ m breach yields $Q_{\text{peak}} > 2\times$ $60$ m breach. | 2D, 3D, HADR, Gauges, Stats |
| **3. Formation Time** | $1.5$ hr | Hydrograph peak attenuation $Q \propto t_f^{-0.35}$. Sharp vs smooth wave. | 2D, 3D, HADR, Gauges, Stats |
| **4. Breach Elevation** | $600.0$ m MSL | Determines active head $H_w = z_{\text{res}} - z_{\text{breach\_elev}}$. | 2D, 3D, HADR, Gauges, Stats |
| **5. Manning's Roughness** | $0.035$ | Depth $h \propto n^{0.35}$, Velocity $v \propto n^{-0.85}$. Friction attenuation. | 2D, 3D, HADR, Gauges, Stats |
| **6. Rainfall Scenario** | `PMF_EXTREME` | Base inflow $Q_{\text{inflow}} = Q_{\text{base}} + f(\text{rain\_mm})$. | 2D, 3D, HADR, Gauges, Stats |
| **7. Hydraulic Model** | `FloodHADR SWE` | Full SWE (advection, fast wave) vs DWE (diffusion, $3$-$5$ min lag). | 2D, 3D, HADR, Gauges, Stats |
| **8. Simulation Duration** | $6.0$ hr | Hydrograph time window & recession curve progression $P(t)$. | 2D, 3D, HADR, Gauges, Stats |

## Scenario A vs Scenario B Mandate Compliance

An automated test in `backend/test_phase32_parameter_responsive_3d_flood.py` verifies:
- **Scenario A**: FRL ($830$ m) + Narrow Breach ($60$ m) $\rightarrow$ $Q_{\text{peak}} \approx 21,400$ m³/s, Max Depth $\approx 10.3$ m, Extent $\approx 27.8$ km².
- **Scenario B**: FRL ($830$ m) + Wide Breach ($300$ m) $\rightarrow$ $Q_{\text{peak}} \approx 107,000$ m³/s, Max Depth $\approx 20.3$ m, Extent $\approx 51.1$ km².

The test confirms physical spatial matrix differences ($\sum h_{\text{matrix, B}} > \sum h_{\text{matrix, A}}$, $\sum WSE_{\text{matrix, B}} > \sum WSE_{\text{matrix, A}}$, Devprayag gauge stage $H_B > H_A$) and fails if only UI numbers are modified.
