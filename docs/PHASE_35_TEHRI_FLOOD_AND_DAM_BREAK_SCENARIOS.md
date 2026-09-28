# PHASE 35 — CORRECT TEHRI FLOOD AND DAM-BREAK SCENARIOS

## Executive Summary
Phase 35 establishes explicit, authoritative separation between flood routing scenarios and dam breach failure scenarios for Tehri Reservoir and Dam.

---

## Critical Mandate: PMF $\neq$ Dam Break
- **Rule Enforced:** A Probable Maximum Flood (PMF) routing scenario does **NOT** automatically imply or equate to a dam break.
- **Hydraulic Isolation:** In non-failure routing scenarios (`TEHRI_PMF_NO_FAILURE`, `TEHRI_SPILLWAY_OPERATION`, `TEHRI_EXTREME_INFLOW`), `breach_occurrence` is set to `False`, and downstream outflows are controlled strictly by reservoir storage routing and spillway discharge capacity ($15,540\text{ m}^3/\text{s}$ design capacity + chute spillways) without introducing artificial breach hydrographs.

---

## Authoritative Scenario Catalog & Schema

Every scenario explicitly defines all **12 mandatory parameters** and carries explicitly labeled engineering/hydrologic assumptions:

| Scenario ID | Category | Level ($m$) | Initial Vol ($\text{Mm}^3$) | Inflow Peak ($\text{m}^3/\text{s}$) | Spillway Capacity ($\text{m}^3/\text{s}$) | Breach Occurrence | Breach Width ($m$) | $t_f$ ($\text{hr}$) | Side Slopes ($H:V$) | Downstream Boundary | Duration ($\text{hr}$) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `TEHRI_PMF_NO_FAILURE` | PMF Routing (No Failure) | 839.5 | 3,550 | 22,400 | 15,540 | `False` | 0.0 | 0.0 | 1.0:1.0 | FREE_OUTFLOW | 36.0 |
| `TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO` | Overtopping Breach | 839.5 | 3,550 | 25,000 | 15,540 | `True` | 220.0 | 1.0 | 0.7:1.0 | FREE_OUTFLOW | 24.0 |
| `TEHRI_FRL_BREACH` | Structural Breach | 830.0 | 3,540 | 4,500 | 3,500 | `True` | 180.0 | 1.5 | 0.7:1.0 | FREE_OUTFLOW | 12.0 |
| `TEHRI_MDDL_BREACH` | Low-Head Breach | 740.0 | 2,100 | 1,200 | 0.0 | `True` | 180.0 | 1.5 | 0.7:1.0 | FREE_OUTFLOW | 12.0 |
| `TEHRI_SPILLWAY_OPERATION` | Spillway Release | 832.0 | 3,540 | 11,800 | 15,540 | `False` | 0.0 | 0.0 | 1.0:1.0 | FREE_OUTFLOW | 24.0 |
| `TEHRI_EXTREME_INFLOW` | Extreme Inflow | 835.0 | 3,540 | 15,540 | 15,540 | `False` | 0.0 | 0.0 | 1.0:1.0 | FREE_OUTFLOW | 30.0 |
| `USER_DEFINED` | Custom User Scenario | 820.0 | 3,200 | 3,000 | 5,000 | `True` | 120.0 | 2.0 | 0.7:1.0 | NORMAL_DEPTH | 12.0 |

---

## Explicit Scenario Definitions & Assumptions Metadata

### 1. `TEHRI_PMF_NO_FAILURE`
- **Description:** Probable Maximum Flood (PMF peak $22,400\text{ m}^3/\text{s}$) routed through Tehri Reservoir using full spillway capacity without dam failure.
- **Assumptions:**
  - PMF does NOT automatically trigger a dam breach.
  - Spillways operate at maximum rated design capacity ($15,540\text{ m}^3/\text{s}$ chute + shaft spillways).
  - Embankment dam structure remains 100% structurally intact throughout flood passage.
  - Peak reservoir elevation reaches crest level ($839.5\text{ m}$).

### 2. `TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO`
- **Description:** Extreme PMF inflow ($25,000\text{ m}^3/\text{s}$) exceeding total spillway discharge capacity, resulting in overtopping above $839.5\text{ m}$ crest elevation and subsequent embankment failure.
- **Assumptions:**
  - Inflow exceeds total spillway discharge capacity.
  - Water level overtops embankment crest elevation at $839.5\text{ m}$.
  - Overtopping initiates progressive erosion breach after $t = 2.5\text{ hr}$.

### 3. `TEHRI_FRL_BREACH`
- **Description:** Structural dam breach initiated at Full Reservoir Level ($830.0\text{ m}$) with $3,540\text{ Mm}^3$ initial active storage.
- **Assumptions:**
  - Reservoir is at Full Reservoir Level ($\text{FRL} = 830.0\text{ m}$).
  - Initial active storage is $3,540\text{ Mm}^3$.
  - Breach develops over $1.5\text{ hr}$ down to elevation $710.0\text{ m}$.

### 4. `TEHRI_MDDL_BREACH`
- **Description:** Structural dam breach initiated at Minimum Drawdown Level ($740.0\text{ m}$) prior to monsoon filling.
- **Assumptions:**
  - Reservoir is at Minimum Drawdown Level ($\text{MDDL} = 740.0\text{ m}$).
  - Reduced hydraulic head results in lower peak breach outflow compared to FRL.
  - Initial storage volume is $2,100\text{ Mm}^3$.

### 5. `TEHRI_SPILLWAY_OPERATION`
- **Description:** Controlled flood routing through Tehri spillway chute and shaft spillways under high inflow conditions without dam breach.
- **Assumptions:**
  - All 4 radial spillway gates are fully functional.
  - Discharge is controlled and contained within spillway chute and downstream plunge pool.
  - Embankment dam structure experiences zero structural damage.

### 6. `TEHRI_EXTREME_INFLOW`
- **Description:** 1000-year return period extreme inflow hydrograph ($15,540\text{ m}^3/\text{s}$) routed through reservoir and spillways without dam breach.
- **Assumptions:**
  - Inflow peak matches total spillway rated capacity ($15,540\text{ m}^3/\text{s}$).
  - Freeboard remains positive ($> 4.5\text{ m}$ below crest).
  - Dam breach does NOT occur.

### 7. `USER_DEFINED`
- **Description:** Custom scenario allowing complete user specification of all 12 hydraulic and structural parameters.

---

## Service & API Endpoints
- **Service Engine:** `backend/app/simulation/tehri_scenario_service.py`
- **Scenario Lab Service:** `backend/app/simulation/scenario_lab_service.py`
- **REST API Endpoints:**
  - `GET /api/scenarios/tehri/catalog`
  - `GET /api/scenarios/tehri/{scenario_id}`
  - `POST /api/scenarios/tehri/evaluate`

---

## Verification & Automated Test Suite
- **Test File:** `backend/test_phase35_tehri_scenarios.py`
- **Test Coverage:**
  1. `test_scenario_catalog_separation`: Validates 6 categories & `pmf_equals_dam_break == False`.
  2. `test_mandatory_twelve_schema_parameters`: Validates presence of all 12 parameters for every scenario.
  3. `test_pmf_no_failure_does_not_equate_to_dam_break`: Validates 0.0 breach outflow for `TEHRI_PMF_NO_FAILURE`.
  4. `test_overtopping_and_breach_scenarios_enable_breach_outflow`: Validates breach outflow for failure scenarios.
  5. `test_assumptions_metadata_presence`: Validates assumptions metadata across all scenarios.
  6. `test_rest_api_tehri_scenario_endpoints`: Validates REST API endpoints.
