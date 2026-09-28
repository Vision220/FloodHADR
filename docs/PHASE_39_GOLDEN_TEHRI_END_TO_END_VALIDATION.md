# PHASE 39 — GOLDEN TEHRI END-TO-END VALIDATION

## Architectural Overview
Phase 39 establishes the **Golden Tehri End-to-End Validation Engine** (`GoldenBenchmarkService`), providing an authoritative, controlled benchmark pipeline that validates the 16-stage end-to-end flow from scenario specification down to scientific report generation.

```
Stage 1: Scenario Definition
   ↓
Stage 2: Tehri Reservoir Initial Storage & Elevation
   ↓
Stage 3: Dam-Break Hydrograph / Boundary Condition Solver
   ↓
Stage 4: FloodHADR 2D Shallow Water Equations (SWE) Solver
   ↓
Stage 5: FloodHADR 2D Diffusive Wave Equation (DWE) Solver
   ↓
Stage 6: HEC-RAS 2D SWE Reference Execution (if available / mock fallback)
   ↓
Stage 7: HEC-RAS 2D DWE Reference Execution (if available / mock fallback)
   ↓
Stage 8: Multi-Model Comparative Evaluation Engine
   ↓
Stage 9: Authoritative 2D GIS Flood Layer Generator
   ↓
Stage 10: Temporal Animation Sequence Generator
   ↓
Stage 11: Real 3D Digital Twin Visualization Engine
   ↓
Stage 12: Google Earth Engine Satellite Observation Comparison
   ↓
Stage 13: Infrastructure Exposure & Impact Assessment
   ↓
Stage 14: HADR Decision Support & Evacuation Router
   ↓
Stage 15: AI Scientific Analysis & Citation Assistant
   ↓
Stage 16: Technical Scientific Report Generation
```

---

## 1. Stage Consistency Audit
Every single stage across the 16-stage pipeline is audited to verify strict identity:
- `scenario_id`: `TEHRI_GOLDEN_BENCHMARK_V1`
- `run_id`: Automatically tracked per benchmark run (e.g. `run-golden-60m-1759045934`)
- `CRS`: `EPSG:32644` (UTM Zone 44N) / `EPSG:4326` (WGS84)
- `DEM`: NRSC / Bhuvan ALOS PALSAR 12.5m DEM
- `time_reference`: `UTC+05:30` (IST)
- `simulation_duration`: `360 minutes` (6.0 hours)

If any stage deviates from these reference metadata parameters, `stage_consistency_audit` flags `all_stages_consistent = False` and identifies the non-conforming stage.

---

## 2. Parametric Sensitivity & Broken Connection Audit
To guarantee that physical parameter modifications propagate across all system components and no layer is disconnected or hardcoded:

1. **Baseline Run A**: Breach width = `60.0 m`
2. **Modified Run B**: Breach width = `180.0 m` (3× expansion)

The audit evaluates physical response and layer responsiveness across 9 critical layers:

| Layer # | Layer Name | Verification Metric | Responsiveness Check |
|---|---|---|---|
| 1 | Dam-Break Hydrograph | Peak Discharge $Q_{\text{peak}}$ ($m^3/s$) | `qA != qB` |
| 2 | Flood Extent | Total Inundation Area ($km^2$) | `extA != extB` |
| 3 | Max Flood Depth | Maximum Inundated Depth ($m$) | `dA != dB` |
| 4 | Max Flow Velocity | Peak Velocity ($m/s$) | `vA != vB` |
| 5 | 2D GIS Flood Map | Hydraulic summary metrics | Depth / Area delta |
| 6 | 3D Digital Twin | Simulation Frame Max Depth ($m$) | Depth / WSE delta |
| 7 | HADR Impact Assessment | Exposed infrastructure count | `hadrA != hadrB` |
| 8 | AI Scientific Analysis | Contextual LLM explanation | Text delta |
| 9 | Technical Report | Reproducibility SHA-256 lineage hash | Hash delta |

If any layer remains unchanged when it should physically respond, the audit flags a `BROKEN_DATA_CONNECTION` for that specific layer.

---

## 3. Verified Endpoints & Test Suite

### REST API Routes (`/api/golden-benchmark/*`):
- `GET  /api/golden-benchmark/baseline-parameters`: Retrieves default baseline scenario configuration (`breach_width_m=60.0m`, `reservoir_level_m=830.0m`).
- `POST /api/golden-benchmark/run`: Executes full 16-stage pipeline for given parameters and returns consistency audit.
- `POST /api/golden-benchmark/audit-sensitivity`: Executes dual-run sensitivity audit (60m vs 180m breach width) and returns broken connection verification.

### Test Suite (`backend/test_phase39_golden_tehri_validation.py`):
- `test_01_baseline_parameters`: Validates configuration defaults.
- `test_02_golden_pipeline_16_stage_execution`: Verifies 16-stage pipeline execution & consistency audit (`all_stages_consistent == True`).
- `test_03_parametric_sensitivity_and_broken_connection_audit`: Verifies breach width change alters hydrograph, depth, velocity, 2D GIS, 3D Twin, HADR, AI text, and report lineage hash without broken connections (`broken_connection_detected == False`).
- `test_04_rest_api_golden_benchmark_endpoints`: Validates HTTP REST endpoints end-to-end.
