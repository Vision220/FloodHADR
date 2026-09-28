# PHASE 43 — FINAL FLOODHADR PROFESSIONAL UI

## Architectural Overview
Phase 43 implements the **Final FloodHADR Professional UI Metadata System** (`ProvenanceHeader`), standardizing metadata header displays across all major pages while preserving the platform's visual identity.

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ ACTIVE SCENARIO  │ MODEL         │ RUN ID               │ TIME     │ DEM                  │
│ Tehri FRL Breach │ FloodHADR SWE │ run-golden-60m-17... │ T+4.8 hr │ ALOS PALSAR 12.5m    │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ STATUS: SIMULATION RESULT    │ PROVENANCE: DERIVED FROM HYDRODYNAMIC MODEL                │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Provenance Header Metadata Specifications

Every major page across FloodHADR displays standard provenance metadata:

1. **ACTIVE SCENARIO**: Identifies active boundary scenario (e.g. `Tehri FRL Breach (PMF Overtopping)`).
2. **MODEL**: Identifies active hydrodynamic solver (e.g. `FloodHADR SWE`, `FloodHADR DWE`, `HEC-RAS 2D`).
3. **RUN ID**: Unique simulation execution run identifier (e.g. `run-golden-60m-1759045934`).
4. **TIME**: Current simulation timeline offset (e.g. `T + 4.8 hr` / `T + 60m`).
5. **DEM / DATA SOURCE**: Elevation raster dataset (e.g. `Bhuvan / NRSC ALOS PALSAR 12.5m DEM`).
6. **STATUS**: Execution status banner (`SIMULATION RESULT` / `COMPUTED`).
7. **PROVENANCE**: Origin lineage statement (`DERIVED FROM HYDRODYNAMIC MODEL`).

---

## Mandate Enforcement

> [!IMPORTANT]
> 1. **Do NOT display "DEMO MODEL" if the actual result is live/real.**
> 2. **Do NOT display "ONLINE" if the service is unavailable.**
> 3. **Preserve Visual Identity**: Retains sleek dark theme, glassmorphism, dynamic micro-animations, and Tailwind CSS palette while eliminating misleading labels.

---

## Verified Endpoints & Test Suite

### Reusable UI Component (`frontend/src/components/common/ProvenanceHeader.tsx`):
- Embedded across major pages ([`DashboardPage.tsx`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/frontend/src/pages/DashboardPage.tsx), [`DigitalTwin3DPage.tsx`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/frontend/src/pages/DigitalTwin3DPage.tsx), [`ModelComparisonPage.tsx`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/frontend/src/pages/ModelComparisonPage.tsx), [`EarthEnginePage.tsx`](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/frontend/src/pages/EarthEnginePage.tsx)).

### Test Suite (`backend/test_phase43_final_professional_ui.py`):
- `test_01_provenance_metadata_header_schema`: PASSED
- `test_02_golden_benchmark_provenance_identity`: PASSED
- `test_03_no_misleading_online_or_demo_labels`: PASSED
- `test_04_rest_api_sync_and_benchmark_provenance`: PASSED
