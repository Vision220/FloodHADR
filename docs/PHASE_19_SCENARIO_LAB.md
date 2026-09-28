# PHASE 19 — SCENARIO COMPARISON LAB

## 1. Executive Summary & Overview
The **Scenario Comparison Lab** in FloodHADR provides dam safety engineers, hydrologists, and emergency management planners with an interactive environment to duplicate, parameterize, and compare dam breach scenarios side-by-side. 

Users can select from 10 preconfigured baseline/extreme operational presets or create user-defined custom scenarios. By modifying 13 fundamental hydraulic and topographic parameters, users can evaluate sensitivity to breach mechanics, reservoir states, hydrometeorological conditions, roughness, computational mesh resolution, and numerical solver models.

---

## 2. 13 Modifiable Scenario Parameters
The lab enables granular customization across 13 core physical, boundary, and numerical modeling parameters:

1. **Reservoir Level ($z_{\text{res}}$)**: Initial reservoir pool elevation ($m$ WGS84/MSL). e.g., $740.0\text{ m}$ (MDDL) to $839.5\text{ m}$ (PMF).
2. **Inflow Hydrograph ($Q_{\text{in}}$)**: Peak inflow discharge into reservoir ($m^3/s$). e.g., $1,200\text{ m}^3/s$ to $22,400\text{ m}^3/s$.
3. **Rainfall Intensity ($P_{\text{rain}}$)**: Direct catchment precipitation depth ($mm$). e.g., $10\text{ mm}$ to $250\text{ mm}$.
4. **Breach Width ($B_{\text{avg}}$)**: Final average breach width ($m$). e.g., $60\text{ m}$ (Partial) to $220\text{ m}$ (PMF).
5. **Breach Formation Time ($t_f$)**: Duration of dam breach development ($hours$). e.g., $0.5\text{ h}$ (Rapid) to $3.0\text{ h}$ (Slow).
6. **Breach Invert Elevation ($z_{\text{invert}}$)**: Final bottom elevation of breach opening ($m$). e.g., $700.0\text{ m}$ to $740.0\text{ m}$.
7. **Breach Type**: Failure mechanism mode (`OVERTOPPING`, `PIPING`, `PARTIAL`, `RAPID`, `SLOW`, `USER_DEFINED`).
8. **Manning's Roughness ($n$)**: Downstream channel & floodplain friction coefficient ($s/m^{1/3}$). e.g., $0.035$ to $0.040$.
9. **Digital Elevation Model (DEM)**: Topographic dataset (`ALOS_PALSAR_12M_REAL`, `SRTM_30M_DEMO`).
10. **Downstream Boundary Condition**: Outlet boundary behavior (`FREE_OUTFLOW`, `NORMAL_DEPTH`, `RATING_CURVE`).
11. **Hydraulic Model**: Governing solver formulation (`FloodHADR SWE`, `FloodHADR DWE`, `HEC-RAS SWE`, `HEC-RAS DWE`).
12. **Mesh Resolution**: Computational grid discretization (`FINE_5M`, `MEDIUM_12M`, `COARSE_30M`).
13. **Simulation Duration**: Total computational forecasting horizon ($hours$). e.g., $6.0\text{ h}$ to $12.0\text{ h}$.

---

## 3. 10 Preconfigured Operational & Extreme Scenarios

| Scenario Preset | Title & Description | $z_{\text{res}}$ (m) | $Q_{\text{in}}$ ($\text{m}^3/\text{s}$) | $B_{\text{avg}}$ (m) | $t_f$ (h) | Failure Mode |
|---|---|---|---|---|---|---|
| **BASELINE** | Standard reservoir operational state at FRL with default overtopping breach | 830.0 | 3,500 | 180.0 | 1.5 | OVERTOPPING |
| **MDDL** | Minimum Drawdown Level (740m) prior to monsoon storage | 740.0 | 1,200 | 180.0 | 1.5 | OVERTOPPING |
| **MID_STORAGE** | 50% live storage pool elevation under moderate inflow | 785.0 | 2,200 | 180.0 | 1.5 | OVERTOPPING |
| **FRL** | Full Reservoir Level (830m) under peak monsoon storage | 830.0 | 4,500 | 180.0 | 1.5 | OVERTOPPING |
| **EXTREME INFLOW** | 1000-year extreme flood hydrograph entering Tehri Reservoir | 835.0 | 15,540 | 180.0 | 1.5 | OVERTOPPING |
| **PMF** | Probable Maximum Flood with maximum spillway overtopping | 839.5 | 22,400 | 220.0 | 1.0 | OVERTOPPING |
| **PARTIAL BREACH** | Partial embankment breach with limited lateral collapse | 830.0 | 3,500 | 60.0 | 1.5 | PARTIAL |
| **RAPID BREACH** | Sudden catastrophic collapse occurring within 30 minutes | 830.0 | 3,500 | 200.0 | 0.5 | RAPID |
| **SLOW BREACH** | Gradual piping failure with prolonged formation time | 830.0 | 3,500 | 150.0 | 3.0 | PIPING |
| **USER DEFINED** | Fully customizable scenario with user-specified parameters | Variable | Variable | Variable | Variable | USER_DEFINED |

---

## 4. Side-by-Side Comparison Engine & 6 Quantitative Difference Metrics

When two scenarios (Scenario A and Scenario B) are selected for side-by-side comparison, `ScenarioLabService` executes the hydraulic simulation pipeline for both parameter sets and evaluates 6 quantitative difference metrics:

$$\Delta h = h_B - h_A \quad \text{[m]}$$
$$\Delta v = v_B - v_A \quad \text{[m/s]}$$
$$\Delta t_{\text{arr}} = t_{\text{arr}, B} - t_{\text{arr}, A} \quad \text{[min]}$$
$$\Delta A = A_B - A_A \quad \text{[km}^2\text{]}$$
$$\Delta \text{Pop} = \text{Pop}_B - \text{Pop}_A$$
$$\Delta \text{Infra} = \text{Infra}_B - \text{Infra}_A$$

1. **Depth Difference ($\Delta h$)**: Signed difference in maximum water depth across downstream cells.
2. **Velocity Difference ($\Delta v$)**: Signed difference in peak flow velocity.
3. **Arrival Time Difference ($\Delta t_{\text{arr}}$)**: Shift in initial flood wave arrival timestamp at key critical assets.
4. **Inundation Area Difference ($\Delta A$)**: Change in overall flooded geographical surface area ($\text{km}^2$).
5. **Affected Population Difference ($\Delta \text{Pop}$)**: Net difference in impacted human population count.
6. **Infrastructure Difference ($\Delta \text{Infra}$)**: Difference in total count of inundated critical infrastructure facilities.

---

## 5. REST API Integration

- `GET /api/scenarios/lab/presets`: Retrieves metadata and default parameters for all 10 preconfigured presets.
- `POST /api/scenarios/lab/duplicate`: Duplicates a specified preset and applies user parameter overrides.
- `POST /api/scenarios/lab/compare`: Executes side-by-side hydraulic evaluation and returns the 6 difference metrics.
