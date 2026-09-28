# Phase 3 — Tehri Dam & Reservoir Technical Data Baseline

**System:** FloodHADR v2  
**Implementation Date:** September 26, 2026  
**Status:** COMPLETED (TEHRI DATA BASELINE CONSOLIDATED & PROVENANCE TRACKED)  

---

## 1. Official Source Hierarchy & Verification Rules

To maintain scientific integrity and prevent arbitrary data overrides, all Tehri Hydro Complex parameters are cataloged in `data/tehri/tehri_parameters.json` and `backend/app/data/tehri/tehri_parameters.json` according to the following official source hierarchy:

```
1. OFFICIAL_THDC  ──► THDC India Limited (Primary Project Constructor & Operator Specifications)
2. CWC            ──► Central Water Commission (National Register of Large Dams & Operating Rules)
3. NRSC           ──► National Remote Sensing Centre / ISRO (Bhuvan Earth Observation Bathymetry)
4. ACADEMIC       ──► Peer-reviewed Hydrological & Climate Literature (IIT Roorkee / IISc / IEEE)
5. DERIVED        ──► Physics-based Hydrodynamic Computations (P = ρgh, F = 0.5 ρgh² B)
6. SCENARIO       ──► User-defined Stress Testing Parameters (Overtopping / PMF Cloudburst)
```

**Discrepancy Policy:** When two authoritative sources disagree on a numerical value (such as crest length or PMF peak flow), **the discrepancy is explicitly preserved** with a `DISCREPANCY_NOTED` status rather than silently overwriting one value. Both values are made available for numerical sensitivity testing.

---

## 2. Complete Tehri Engineering Parameter Baseline

### A. Dam Structure
| Parameter Name | Value | Unit | Source | Source Type | Status | Notes / Discrepancy Rationale |
|---|---|---|---|---|---|---|
| **River Name** | Bhagirathi River | - | THDC Official Profile | `OFFICIAL_THDC` | `VERIFIED` | Headstream of the Ganges, origin at Gaumukh (Gangotri Glacier). |
| **Dam Structural Type** | Earth and Rockfill Dam | - | THDC / CWC NRLD | `OFFICIAL_THDC` | `VERIFIED` | Earth clay core with rockfill shell; seismic Zone V design. |
| **Dam Height** | 260.5 | m | THDC / CWC | `OFFICIAL_THDC` | `VERIFIED` | Tallest dam in India (5th tallest globally). CWC: 260.5 m; Academic: 260.0 m. |
| **Crest Length** | 575.0 | m | THDC Technical Specs | `OFFICIAL_THDC` | `DISCREPANCY_NOTED` | THDC lists 575 m main crest. CWC NRLD lists 592 m (including abutments). |
| **Crest Width** | 20.0 | m | THDC Design Manual | `OFFICIAL_THDC` | `VERIFIED` | Roadway width at crest elevation 839.5 m. |
| **Crest Elevation** | 839.5 | m MSL | THDC DPR | `OFFICIAL_THDC` | `VERIFIED` | Provides 4.5 m freeboard above Maximum Water Level (835.0 m). |

### B. Reservoir Hydrology & Storage Volumes
| Parameter Name | Value | Unit | Source | Source Type | Status | Notes / Discrepancy Rationale |
|---|---|---|---|---|---|---|
| **Gross Storage** | 3540.0 | MCM | THDC DPR / CWC | `OFFICIAL_THDC` | `DISCREPANCY_NOTED` | THDC/CWC list 3,540 MCM (3.54 billion m³). NRSC Bhuvan estimates 3,530 MCM (sedimentation). |
| **Live Storage** | 2615.0 | MCM | THDC / CWC | `CWC` | `VERIFIED` | Effective storage capacity between MDDL (740 m) and FRL (830 m). |
| **Dead Storage** | 925.0 | MCM | THDC / CWC | `CWC` | `VERIFIED` | Sedimentation storage below MDDL (740 m). |
| **Full Reservoir Level (FRL)** | 830.0 | m MSL | THDC Operating Manual | `OFFICIAL_THDC` | `DISCREPANCY_NOTED` | Normal FRL is 830.0 m. Maximum Flood Level (MWL) is 835.0 m. |
| **Maximum Water Level (MWL)** | 835.0 | m MSL | THDC Spillway Guidelines | `OFFICIAL_THDC` | `VERIFIED` | Maximum permissible reservoir elevation during PMF routing. |
| **Minimum Drawdown Level (MDDL)** | 740.0 | m MSL | THDC Power House Manual | `OFFICIAL_THDC` | `VERIFIED` | Lowest operating level for Francis turbines in Underground Power House. |
| **Dead Storage Level (DSL)** | 720.0 | m MSL | CWC Sedimentation Report | `CWC` | `VERIFIED` | Level below which sediment deposits; turbine intake inverts above EL 720 m. |
| **Reservoir Area at FRL** | 42.0 | km² | NRSC / Sentinel-2 | `NRSC` | `DISCREPANCY_NOTED` | NRSC satellite bathymetry observes 42.0 km² at EL 830 m. THDC DPR lists 45.0 km² at MWL. |

### C. Hydroelectric Power Generation
| Parameter Name | Value | Unit | Source | Source Type | Status | Notes / Discrepancy Rationale |
|---|---|---|---|---|---|---|
| **Tehri HPP Installed Capacity** | 1000.0 | MW | THDC Official Website | `OFFICIAL_THDC` | `VERIFIED` | Stage-I HPP capacity (4 x 250 MW). Tehri PSP adds 1,000 MW pumped storage. |
| **Generating Units** | 4 x 250 MW | - | THDC Generation Records | `OFFICIAL_THDC` | `VERIFIED` | 4 vertical Francis turbine-generators in Underground Power House (Left Bank). |

### D. Spillway System & Flood Discharge
| Parameter Name | Value | Unit | Source | Source Type | Status | Notes / Discrepancy Rationale |
|---|---|---|---|---|---|---|
| **Chute Spillway Capacity** | 13800.0 | m³/s | THDC Hydraulic Design | `OFFICIAL_THDC` | `VERIFIED` | Gated chute spillway with 3 radial gates (14 m x 15.5 m each) on right bank. |
| **Four Shaft Spillways Capacity** | 1740.0 | m³/s | THDC Shaft Design | `OFFICIAL_THDC` | `VERIFIED` | 4 ungated vertical morning-glory shaft spillways discharging 1,740 m³/s total. |
| **Total Design Spillway Capacity** | 15540.0 | m³/s | THDC / CWC Approval Specs | `OFFICIAL_THDC` | `VERIFIED` | Sum of Chute Spillway (13,800 m³/s) + 4 Shaft Spillways (1,740 m³/s) = 15,540 m³/s. |
| **PMF Design Inflow** | 15540.0 | m³/s | CWC Flood Frequency | `CWC` | `DISCREPANCY_NOTED` | Official CWC PMF is 15,540 m³/s. IIT Roorkee / IISc 2024 studies calculate climate PMF of 21,400 m³/s. |

---

## 3. UI Parameter Provenance & Discrepancy Inspection

The frontend page [`DamReservoirIntelligencePage.tsx`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/frontend/src/pages/DamReservoirIntelligencePage.tsx) now renders an interactive **Tehri Dam & Reservoir Parameter Provenance Database Table**:

- **Color-Coded Source Badges:**
  - `OFFICIAL_THDC`: Indigo badge (Official Government Record)
  - `CWC`: Sky-blue badge (Central Water Commission)
  - `NRSC`: Emerald badge (ISRO Satellite Observation)
  - `ACADEMIC`: Amber badge (Peer-Reviewed Literature)
- **Discrepancy Highlight:** Rows with `DISCREPANCY_NOTED` are highlighted in amber with explicit explanatory notes detailing source differences.
- **REST Endpoint:** Served directly via `GET /api/dams/tehri/parameters` from `backend/app/api/dam.py`.

---

## 4. Automated Verification Results

All backend unit tests were executed following the data model update:
- `test_simulation_engine.py`: PASSED (11-step 2D finite volume solver verified).
- `test_phase3_dam_api.py`: PASSED (Dam & reservoir parameters verified).
- `test_phase1_data_models.py`: PASSED (Pydantic domain schemas & provenance attributes verified).
