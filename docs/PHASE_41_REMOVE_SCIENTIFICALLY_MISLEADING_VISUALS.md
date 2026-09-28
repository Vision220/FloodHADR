# PHASE 41 — REMOVE SCIENTIFICALLY MISLEADING VISUALS

## Architectural Overview
Phase 41 enforces strict **scientific transparency & visual integrity** across the entire FloodHADR platform (`ScientificVisualAuditService`).

Every code file, UI component, and data service is audited against 6 explicit categories (A through F) to guarantee that:
- No hardcoded or static flood line / polygon exists without dynamic solver backing.
- No unlabeled random infrastructure or procedural terrain appears in REAL mode.
- No fake HEC-RAS or GEE satellite results are fabricated when binaries or credentials are unavailable.
- Every synthetic or demo object is explicitly tagged with `provenance: DEMO` / `DEMO_BENCHMARK` and `label: DEMO`.

---

## Repository Term Audit & Categorization Matrix

| Term | File Path | Category | Description & Disposition | Compliance Status |
|---|---|---|---|---|
| `fake` | `backend/app/hec_ras/hec_ras_reference_service.py` | **C. Scientific result** | Mandate enforcement comment — verifies HEC-RAS results are NEVER fabricated. | **COMPLIANT** |
| `fake` | `backend/app/simulation/ai_comparison_assistant.py` | **C. Scientific result** | AI Assistant mandate enforcement comment — requires tool data retrieval. | **COMPLIANT** |
| `dummy` | `frontend/src/components/3d/WaterParticles.tsx` | **B. Legitimate UI placeholder** | Three.js `Object3D` instancing helper (`dummy = new THREE.Object3D()`). | **COMPLIANT** |
| `random` | `frontend/src/simulation/DigitalTwinEngine.ts` | **E. Hydraulic data** | Replaced `Math.random` velocity noise with deterministic cell distance formulation. | **COMPLIANT** |
| `placeholder` | `frontend/src/pages/DamBreakScenarioPage.tsx` | **B. Legitimate UI placeholder** | Form input HTML element placeholder (`placeholder="e.g. 180.0 m"`). | **COMPLIANT** |
| `demo` | `backend/app/gis/digital_twin_3d_service.py` | **D. Infrastructure data** | Synthetic 3D assets explicitly tagged with `provenance: DEMO`, `is_synthetic: true`, `label: DEMO`. | **COMPLIANT** |
| `mock` | `frontend/src/components/map/LeafletMap.tsx` | **F. Obsolete code** | Legacy standalone map component tagged as Obsolete / Demo visualizer. | **COMPLIANT** |
| `demo` | `backend/app/satellite/gee_flood_analysis_service.py` | **A. Legitimate DEMO fallback** | GEE satellite analysis tagged with `gee_execution_state` and `provenance: DEMO_BENCHMARK`. | **COMPLIANT** |

---

## Scientific Transparency Rules

> [!IMPORTANT]
> 1. **No Static Flood Line Remaining**: All 2D and 3D inundation overlays are 100% computed from backend dynamic `SimulationFrame` outputs.
> 2. **No Static Flood Polygon Remaining**: Polyline and polygon features in `GISMapModule` represent actual solver grid cells.
> 3. **No Random Infrastructure in REAL Mode**: Real mode displays verified GIS inventory (`NRSC GIS Database`, `THDC Official Record`, `NHAI Bridge Survey`).
> 4. **No Procedural Terrain in REAL Mode**: Real mode 3D digital twin renders the authoritative 12.5m ALOS PALSAR DEM elevation matrix.
> 5. **No Fake HEC-RAS Result**: When HEC-RAS executable or HDF package is missing, system explicitly reports `HEC-RAS RESULT STATUS: NOT AVAILABLE`.
> 6. **No Fake GEE Imagery**: Earth Engine panel explicitly reports execution state (`LIVE` | `DEMO` | `NOT CONFIGURED` | `ERROR`).
> 7. **No Fake AI Analysis**: AI Assistant executes data inspection tools (`get_scenario()`, `get_model_result()`, `get_validation_result()`) before answering.
> 8. **Mandatory DEMO Labeling**: Every synthetic object in DEMO mode explicitly presents `label: DEMO` / `label: SYNTHETIC`.

---

## Verified Endpoints & Test Suite

### REST API Route (`/api/gis/visual-audit`):
- `GET /api/gis/visual-audit`: Executes full repository scientific visual & provenance audit and returns compliance verification.

### Test Suite (`backend/test_phase41_scientific_visual_audit.py`):
- `test_01_full_visual_and_provenance_audit`: PASSED
- `test_02_no_static_flood_line_or_polygon`: PASSED
- `test_03_no_fake_hecras_or_gee_results`: PASSED
- `test_04_demo_objects_labeled_demo_synthetic`: PASSED
- `test_05_rest_api_visual_audit_endpoint`: PASSED
