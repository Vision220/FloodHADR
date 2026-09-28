# PHASE 37 — SCIENTIFIC AI MODEL COMPARISON AND DIAGNOSTIC ASSISTANT

## Architectural Overview
Phase 37 repairs and upgrades the AI Assistant into an authoritative **Scientific Model Comparison and Diagnostic Assistant**.
The assistant connects directly to real project data services, enforces zero-fabrication rules, cites metadata for every response, provides 8 explicit inspection functions/tools, answers key hydraulic questions, and maintains a complete AI Audit Log.

---

## Data Connections & System Architecture

```
                                  ┌───────────────────────────────┐
                                  │   TehriScenarioService        │
                                  └───────────────┬───────────────┘
                                                  │
 ┌──────────────────────────────┐                 ▼                 ┌──────────────────────────────┐
 │ GIS2DLayerService            ├─────────► Scientific AI  ◄────────┤ HydraulicModelComparisonEngine│
 └──────────────────────────────┘           Assistant               └──────────────────────────────┘
                                          Engine (v2.0)
 ┌──────────────────────────────┐                 ▲                 ┌──────────────────────────────┐
 │ GEEFloodAnalysisService      ├─────────┬───────┴───────┬─────────┤ HECRASReferenceService       │
 └──────────────────────────────┘         │               │         └──────────────────────────────┘
                                          ▼               ▼
                                 ┌────────────────┐ ┌─────────────┐
                                 │ Citation Engine│ │ AI Audit Log│
                                 └────────────────┘ └─────────────┘
```

---

## 8 Explicit Data Inspection Functions / Tools

1. `get_scenario(scenario_id: str)`: Inspects scenario parameters, initial storage, spillway status, breach parameters.
2. `get_model_result(model_name: str, scenario_id: str)`: Retrieves solver outputs (peak Q, max depth, max velocity, flooded area).
3. `get_model_metrics(model_name: str)`: Retrieves quantitative performance metrics (RMSE, MAE, NSE, KGE, IoU).
4. `get_virtual_gauge(gauge_id: str)`: Retrieves stage, velocity, and arrival time hydrographs.
5. `get_validation_result(model_a: str, model_b: str)`: Retrieves spatial and temporal comparison metrics between models.
6. `get_flood_extent_statistics(dataset_id: str)`: Retrieves satellite flood extent statistics and spatial IoU overlap.
7. `get_asset_impacts(scenario_id: str)`: Retrieves HADR infrastructure and population exposure metrics.
8. `get_provenance(item_id: str)`: Retrieves data provenance, CRS, vertical datum, and metadata quality tags.

---

## Zero-Fabrication Mandate & Mandatory Citation

Every AI answer must strictly retrieve stored values from active project services.
If requested evidence or variables are unverified or missing from the project database, the AI outputs:
`"Insufficient evidence in the current project dataset."`

Every response automatically formats a mandatory scientific citation block:

```
--- MANDATORY SCIENTIFIC CITATION ---
• Scenario ID: TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO
• Model: FloodHADR SWE v2.0
• Run ID: sim-run-2026-001
• Dataset: ALOS PALSAR 12.5m DEM / CWC Telemetry
• Timestamp: 2026-09-28T07:30:50.000000Z
```

---

## AI Audit Log Schema

Every diagnostic query generates an audited entry containing:
- `question`: User query string
- `retrieved_datasets`: List of internal datasets accessed
- `calculations`: List of quantitative derivations and residuals
- `answer`: Full answer text including citation
- `timestamp`: ISO-8601 UTC timestamp
- `model_version`: "FloodHADR Scientific AI Diagnostic Assistant v2.0"

---

## Verified Endpoints & Test Suite

- **REST API Routes (`/api/analysis/ai-assistant/*`):**
  - `POST /api/analysis/ai-assistant/query`
  - `GET /api/analysis/ai-assistant/audit-log`
  - `GET /api/analysis/ai-assistant/tools/scenario`
  - `GET /api/analysis/ai-assistant/tools/model-result`
  - `GET /api/analysis/ai-assistant/tools/virtual-gauge`
  - `GET /api/analysis/ai-assistant/tools/validation-result`
  - `GET /api/analysis/ai-assistant/tools/flood-extent-statistics`
  - `GET /api/analysis/ai-assistant/tools/asset-impacts`
  - `GET /api/analysis/ai-assistant/tools/provenance`

- **Automated Verification:**
  `backend/test_phase37_ai_diagnostic_assistant.py` (6/6 tests PASSED OK).
