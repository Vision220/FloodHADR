# FINAL_AI_AUDIT — SCIENTIFIC AI COMPARISON & DIAGNOSTIC ASSISTANT AUDIT

## Executive Summary
This document provides the scientific audit of FloodHADR's Scientific AI Comparison and Diagnostic Assistant (`AIComparisonAssistantService`).

---

## 1. Tool Data Inspection & Data Retrieval Architecture

The AI assistant executes 8 explicit data inspection tools to fetch factual values before responding to user queries:

1. `get_scenario(scenario_id)`: Fetches reservoir, breach, and hydraulic parameters.
2. `get_model_result(model_name, time_step_min)`: Fetches dynamic `SimulationFrame` outputs.
3. `get_model_metrics(model_name)`: Fetches summary peak metrics ($Q_{\text{peak}}, h_{\max}, v_{\max}, \text{Area}$).
4. `get_virtual_gauge(gauge_id)`: Fetches hydrograph stage-discharge time series.
5. `get_validation_result(model_a, model_b)`: Fetches spatial overlap (IoU) & hydrodynamic error metrics (RMSE, MAE, NSE, KGE).
6. `get_flood_extent_statistics()`: Fetches inundated area breakdown by hazard class.
7. `get_asset_impacts(asset_type)`: Fetches exposed infrastructure status, arrival lead-times, and depths.
8. `get_provenance(dataset)`: Fetches dataset lineage, CRS, resolution, and acquisition metadata.

---

## 2. Citation & Integrity Rules Compliance

- **Rule 1: No Fabrication**: The AI NEVER invents values or guesses parameters. If evidence is unlocated, states: `"Insufficient evidence in current project dataset."`
- **Rule 2: Mandatory Citations**: Every answer includes explicit provenance citations (`Scenario ID`, `Model`, `Run ID`, `Dataset`, `Timestamp`).
- **Rule 3: Audit Logging**: Maintains a persistent AI Audit Log recording query, retrieved datasets, calculations, answer, and timestamp.

---

## 3. Verified Question Response Audits

| # | Scientific Question | Tool Inspections Called | Citation Verification | Audit Status |
|---|---|---|---|---|
| 1 | "What changed between SWE and DWE?" | `get_model_metrics()`, `get_validation_result()` | Cited `TEHRI_GOLDEN_BENCHMARK_V1` & `Run ID` | **PASSED** |
| 2 | "Why is FloodHADR flood extent different from HEC-RAS?" | `get_model_metrics()`, `get_validation_result()` | Cited `HEC-RAS 2D SWE` & `IoU = 0.948` | **PASSED** |
| 3 | "Which locations have the earliest arrival?" | `get_asset_impacts()`, `get_virtual_gauge()` | Cited `Tehri Dam Access Highway (t=0.1m)` | **PASSED** |
| 4 | "What parameters caused the largest difference?" | `get_scenario()`, `get_model_metrics()` | Cited `Breach Width (60m vs 180m)` | **PASSED** |
| 5 | "Is HEC-RAS data actually available?" | `get_provenance()` | Cited `HEC-RAS Reference Service Status` | **PASSED** |
| 6 | "Does the AI invent results?" | `get_provenance()`, Audit Log | Verified 100% tool retrieval backing | **PASSED** |
