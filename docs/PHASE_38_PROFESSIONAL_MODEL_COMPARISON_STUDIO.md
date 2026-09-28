# PHASE 38 — PROFESSIONAL MODEL COMPARISON STUDIO

## Architectural Overview
Phase 38 implements the **Professional Model Comparison Studio**, providing a dedicated workspace for comparative evaluation between any pair of hydraulic models:
- **FloodHADR SWE** (2D Shallow Water Equations)
- **FloodHADR DWE** (2D Diffusive Wave Equation)
- **HEC-RAS SWE** (USACE HEC-RAS 2D Full Momentum)
- **HEC-RAS DWE** (USACE HEC-RAS 2D Diffusive Wave)

---

## Spatial Domain Alignment & Scenario Guardrail

Both Model A and Model B are aligned on the **identical spatial domain**:
- **Authoritative DEM**: NRSC / Bhuvan ALOS PALSAR 12.5m DEM
- **Spatial Resolution**: 25.0 m cell size (30 x 30 grid)
- **Coordinate Reference System**: EPSG:32644 (UTM Zone 44N) / EPSG:4326 (WGS84)
- **Map Extent**: `[30.36°N, 78.46°E]` to `[30.38°N, 78.49°E]`

### Scenario Mismatch Guardrail
If `scenario_a_id != scenario_b_id`, the system automatically issues a high-priority warning banner:
`⚠️ SCENARIO MISMATCH WARNING: Model A scenario ('TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO') differs from Model B scenario ('TEHRI_FRL_BREACH'). Boundary conditions and initial storage conditions are not identical!`

---

## 8 Supported Comparison Views

1. **Flood Extent View**:
   - Model A area (km²), Model B area (km²), Intersection area (TP), Union area, Delta area.
   - Spatial overlap metrics: IoU, Precision, Recall, F1 Score.
2. **Depth View**:
   - Max Depth A vs Max Depth B, Depth RMSE (m), Depth MAE (m), 2D depth grids.
3. **Velocity View**:
   - Max Velocity A vs Max Velocity B, Velocity RMSE (m/s), Velocity MAE (m/s), 2D flow velocity magnitude grids.
4. **Arrival Time View**:
   - Mean Arrival Time A vs Mean Arrival Time B, Wave front delay / lag (min).
5. **Water Surface View**:
   - Peak WSE A vs Peak WSE B (m MSL), Water surface elevation difference grid.
6. **Hydrograph View**:
   - Discharge time-series Q(t) for Model A & B, Peak Q difference (m³/s), Peak timing difference (min), Hydrograph RMSE, MAE, NSE, KGE.
7. **Difference Map View**:
   - Absolute Depth Difference grid `|h_A - h_B|`
   - Relative Depth Difference grid `|(h_A - h_B) / max(0.05, h_B)| * 100%`
   - Absolute Velocity Difference grid `|v_A - v_B|`
   - Categorical Disagreement Map (TP=Agreement, FP=Model A Only, FN=Model B Only, TN=Unflooded)
8. **Statistics View**:
   - Complete multi-criteria evaluation table and mandatory non-declaration statement (`DO NOT USE AN ARBITRARY 'BEST MODEL' SCORE`).

---

## Verified Endpoints & Test Suite

- **REST API Routes (`/api/multi-model/comparison-studio/*`):**
  - `POST /api/multi-model/comparison-studio/compare-pair`
  - `GET  /api/multi-model/comparison-studio/views`

- **Frontend Component (`frontend/src/pages/ModelComparisonPage.tsx`):**
  - Interactive Model A / Model B & Scenario A / Scenario B selectors.
  - 8 View tabs bar (`Waves`, `Droplets`, `Zap`, `Clock`, `Mountain`, `TrendingUp`, `Map`, `BarChart3`).
  - Scenario Mismatch warning banner.

- **Automated Verification:**
  `backend/test_phase38_model_comparison_studio.py` (4/4 tests PASSED OK).
