# PHASE 25 — TEHRI DAM AUTHORITATIVE DATA MODEL

## Executive Summary & Engineering Mandate
Phase 25 replaces all hard-coded and unverified Tehri Dam parameters with a **source-controlled engineering data model**. Primary parameters are verified directly against official THDC India Limited (THDCIL) documentation, Central Water Commission (CWC) National Register of Large Dams (NRLD), and Detailed Project Reports (DPR).

---

## Data Schema Specification: `DamParameter`

```typescript
interface DamParameter {
  parameter: string;           // Canonical identifier (e.g. dam_height, frl, pmf_capacity)
  category: string;            // Dam | Reservoir | Spillway | Tehri HPP | Geotechnical | Hydraulics
  value: number | string;      // Numerical value or specification string
  unit: string;                // Metric unit (e.g., m, MCM, m³/s, MW)
  source: string;              // Primary authoritative source document or agency
  source_url: string;          // Verifiable web URL or publication reference
  provenance: 'REAL' | 'DERIVED' | 'APPROXIMATE' | 'REQUIRES_VERIFICATION' | 'SCENARIO' | 'SIMULATED' | 'DEMO';
  confidence: number;          // Confidence score between 0.0 and 1.0
  verification_status: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'REQUIRES_VERIFICATION' | 'UNVERIFIED';
  notes?: string;              // Technical notes or derivation formula
}
```

---

## Authoritative Tehri Dam Parameter Database

| Category | Parameter | Value | Unit | Source | Provenance | Status | Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Dam** | `dam_name` | Tehri Dam | — | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Dam** | `river` | Bhagirathi River | — | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Dam** | `dam_type` | Earth and Rockfill Dam | — | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Dam** | `dam_height` | 260.5 | m | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Dam** | `dam_top_length` | 575.0 | m | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Reservoir** | `gross_storage` | 3540.0 | MCM | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Reservoir** | `live_storage` | 2615.0 | MCM | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Reservoir** | `mddl` | EL 740.0 | m MSL | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Reservoir** | `frl` | EL 830.0 | m MSL | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Spillway** | `spillway_chute_bays` | 3 | bays | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Spillway** | `right_bank_shaft_spillways` | 2 | shafts | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Spillway** | `left_bank_shaft_spillways` | 2 | shafts | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Spillway** | `pmf_discharge_capacity` | 15540.0 | m³/s | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Tehri HPP** | `hpp_total_capacity` | 1000.0 | MW | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Tehri HPP** | `hpp_generating_units` | 4 × 250 MW Francis | units | THDC India Limited | `REAL` | `VERIFIED` | 1.00 |
| **Dam Geometry** | `crest_elevation` | EL 839.5 | m MSL | THDC DPR Sec 4.2 | `DERIVED` | `PARTIALLY_VERIFIED` | 0.95 |
| **Dam Geometry** | `foundation_elevation` | EL 579.0 | m MSL | CWC NRLD Registry | `DERIVED` | `REQUIRES_VERIFICATION` | 0.90 |
| **Dam Geometry** | `upstream_slope` | 1 : 2.5 | V : H | THDC Structural DPR | `REQUIRES_VERIFICATION` | `REQUIRES_VERIFICATION` | 0.85 |
| **Dam Geometry** | `downstream_slope` | 1 : 2.0 | V : H | THDC Structural DPR | `REQUIRES_VERIFICATION` | `REQUIRES_VERIFICATION` | 0.85 |
| **Spillway** | `spillway_crest_elevation` | EL 815.0 | m MSL | THDC Hydraulic Tables | `APPROXIMATE` | `REQUIRES_VERIFICATION` | 0.88 |
| **Breach Physics**| `breach_top_width` | 180.0 | m | Froehlich (2008) Eq | `DERIVED` | `REQUIRES_VERIFICATION` | 0.82 |
| **Storage Curve** | `elevation_storage_relation` | $V(h) = 925 + 2615 (\frac{h-740}{90})^{1.45}$ | MCM | THDC Storage Curve | `DERIVED` | `PARTIALLY_VERIFIED` | 0.92 |

---

## Rules Enforced in UI and API

1. **Explicit Provenance**: Every parameter rendered in the UI includes its source URL, provenance tag (`REAL`, `DERIVED`, `APPROXIMATE`, `REQUIRES_VERIFICATION`), and confidence score.
2. **No Invented Geometry**: Structural values requiring engineering verification are explicitly flagged as `REQUIRES_VERIFICATION` instead of being quietly assigned arbitrary fallback numbers.
3. **Traceability**: API route `/api/v1/dams/tehri/parameters` serves authoritative THDC parameters directly to frontend components.
