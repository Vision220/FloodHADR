# PHASE 20 — VALIDATION AND SENSITIVITY

## 1. Executive Summary & Overview
The **Validation and Sensitivity Engine** in FloodHADR provides objective, scientifically rigorous verification of hydraulic simulation outputs against empirical observations. 

To maintain scientific integrity, FloodHADR explicitly prohibits fabricated confidence scores (e.g. claiming "98.4% accuracy"). Instead, model runs and datasets are categorized under 6 strict scientific status classifications, and evaluated using standard hydrological efficiency and goodness-of-fit metrics (RMSE, MAE, NSE, KGE, Peak Error, Timing Error, IoU, F1).

---

## 2. Observational Validation Framework
Where ground-truth measurements exist, simulated hydraulic state vectors are evaluated against 7 observational data streams:

1. **Reservoir Levels ($z_{\text{res}}$)**: In-situ telemetry or CWC reservoir gauge stage records ($m$).
2. **Inflow Hydrographs ($Q_{\text{in}}$)**: Catchment runoff and upstream river gauge discharge ($m^3/s$).
3. **Outflow Hydrographs ($Q_{\text{out}}$)**: Spillway, powerhouse, and breach release discharge series ($m^3/s$).
4. **River Discharge ($Q_{\text{river}}$)**: Downstream CWC river gauging station records (e.g., Devprayag station).
5. **Historical Flood Extent**: Field-mapped maximum inundation boundaries from past extreme events (e.g., June 2013 flood).
6. **Satellite Flood Observations**: High-resolution Synthetic Aperture Radar (SAR) water masks derived from Sentinel-1 or RISAT-1.
7. **Gauge Hydrographs**: High-frequency stage-time and flow-time series at downstream bridge and community locations.

---

## 3. Goodness-of-Fit & Accuracy Metrics

### 3.1 Time-Series & Hydrograph Metrics
- **Root Mean Square Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{i=1}^N (Q_{\text{sim}, i} - Q_{\text{obs}, i})^2} \quad [\text{m}^3/\text{s}]$$
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{N}\sum_{i=1}^N |Q_{\text{sim}, i} - Q_{\text{obs}, i}| \quad [\text{m}^3/\text{s}]$$
- **Nash-Sutcliffe Efficiency (NSE)**:
  $$\text{NSE} = 1 - \frac{\sum_{i=1}^N (Q_{\text{obs}, i} - Q_{\text{sim}, i})^2}{\sum_{i=1}^N (Q_{\text{obs}, i} - \bar{Q}_{\text{obs}})^2}$$
- **Kling-Gupta Efficiency (KGE)**:
  $$\text{KGE} = 1 - \sqrt{(r - 1)^2 + (\beta - 1)^2 + (\gamma - 1)^2}$$
  *where $r$ is Pearson correlation, $\beta = \mu_{\text{sim}}/\mu_{\text{obs}}$, and $\gamma = (\sigma_{\text{sim}}/\mu_{\text{sim}})/(\sigma_{\text{obs}}/\mu_{\text{obs}})$.*
- **Peak Discharge Error ($\Delta Q_{\text{peak}}$)**:
  $$\Delta Q_{\text{peak}} = Q_{\text{sim, peak}} - Q_{\text{obs, peak}} \quad [\text{m}^3/\text{s}]$$
- **Timing Error ($\Delta t_{\text{peak}}$)**:
  $$\Delta t_{\text{peak}} = t_{\text{sim, peak}} - t_{\text{obs, peak}} \quad [\text{hours or minutes}]$$

### 3.2 Spatial Extent & Inundation Accuracy
- **Intersection over Union (IoU)**:
  $$\text{IoU} = \frac{|E_{\text{sim}} \cap E_{\text{obs}}|}{|E_{\text{sim}} \cup E_{\text{obs}}|}$$
- **F1 Score**:
  $$\text{F1} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

---

## 4. Sensitivity Testing Across 7 Core Parameters

Sensitivity analysis evaluates model output responsiveness ($Y$) to controlled perturbations in input parameter ($X_j$), computing the non-dimensional Sensitivity Index $S_j = \frac{\Delta Y / Y_0}{\Delta X_j / X_{j,0}}$:

1. **Breach Width ($B_{\text{avg}}$)**: Perturbation $\pm 20\%$. Direct impact on peak discharge magnitude and initial arrival time.
2. **Breach Formation Time ($t_f$)**: Perturbation $\pm 30\%$. Highly sensitive parameter governing hydrograph peak sharpness.
3. **Reservoir Level ($z_{\text{res}}$)**: Perturbation $\pm 5\text{ m}$. Determines initial potential energy and released flood volume.
4. **Manning's Roughness ($n$)**: Perturbation $\pm 25\%$. Controls downstream wave attenuation and wave celerity.
5. **DEM Resolution**: Comparison between $12\text{m}$ ALOS PALSAR and $30\text{m}$ SRTM DEM. Coarser DEM dampens peak depths.
6. **Mesh Resolution**: Comparison between $5\text{m}$ Fine, $12\text{m}$ Medium, and $30\text{m}$ Coarse grid discretization.
7. **Downstream Boundary Condition**: Evaluation across `FREE_OUTFLOW`, `NORMAL_DEPTH`, and `RATING_CURVE`. Influences lower reach backwater profiles.

---

## 5. Strict Validation Status Classification

FloodHADR enforces 6 unambiguous scientific validation statuses to ensure transparency:

| Status Classification | Description & Criteria |
|---|---|
| **VALIDATED** | Model outputs rigorously verified against high-quality ground-truth gauge & satellite observations with high NSE ($>0.75$). |
| **PARTIALLY VALIDATED** | Model outputs evaluated against sparse or indirect observations (e.g., single SAR satellite pass or distant gauge station). |
| **UNVALIDATED** | No direct observational ground-truth data available for numerical validation. |
| **SCENARIO** | Hypothetical extreme event simulation (e.g., PMF or breach design flood) with no historical observational counterpart. |
| **EXPERIMENTAL** | Novel numerical solver scheme or modified physics formulation undergoing internal benchmarking. |
| **DEMO** | Synthetic demonstration dataset or default baseline setup. |

---

## 6. REST API Integration

- `GET /api/validation/status`: Returns definitions of the 6 validation status classifications and available ground-truth datasets.
- `POST /api/validation/evaluate`: Computes RMSE, MAE, NSE, KGE, Peak Error, Timing Error, IoU, and F1 score against observational hydrographs and spatial extents.
- `POST /api/validation/sensitivity`: Performs parameter sensitivity analysis across the 7 specified physical and numerical parameters.

