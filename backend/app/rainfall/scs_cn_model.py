import math
from typing import Dict, Any, List, Optional

def adjust_cn_for_amc(cn_ii: float, amc: str = "AMC_II") -> float:
    """
    Adjusts Base Curve Number (CN_II) for Antecedent Moisture Conditions (AMC):
    - AMC_I (Dry): CN_I = (4.2 * CN_II) / (10 - 0.058 * CN_II)
    - AMC_II (Normal): CN_II
    - AMC_III (Wet / Saturated): CN_III = (23 * CN_II) / (10 + 0.13 * CN_II)
    """
    cn_ii_clamped = max(10.0, min(99.0, float(cn_ii)))
    
    if amc in ["AMC_I", "AMC_1", "DRY"]:
        cn_adjusted = (4.2 * cn_ii_clamped) / (10.0 - 0.058 * cn_ii_clamped)
    elif amc in ["AMC_III", "AMC_3", "WET", "SATURATED"]:
        cn_adjusted = (23.0 * cn_ii_clamped) / (10.0 + 0.13 * cn_ii_clamped)
    else:
        cn_adjusted = cn_ii_clamped

    return round(max(10.0, min(99.0, cn_adjusted)), 1)


def calculate_scs_cn_runoff(
    rainfall_p_mm: float,
    cn_value: float = 78.0,
    amc: str = "AMC_II",
    lambda_val: float = 0.20,
    catchment_area_km2: float = 1240.0
) -> Dict[str, Any]:
    """
    Computes SCS-CN runoff parameters according to exact equations:
    S = 25400/CN - 254
    Ia = lambda * S
    Q = (P - Ia)^2 / (P - Ia + S) for P > Ia
    Runoff Volume = Q * Area_km2 * 1000 m3
    """
    effective_cn = adjust_cn_for_amc(cn_value, amc)

    # 1. Potential Maximum Retention S (mm)
    retention_s_mm = round((25400.0 / effective_cn) - 254.0, 2)

    # 2. Initial Abstraction Ia (mm)
    initial_abstraction_ia_mm = round(lambda_val * retention_s_mm, 2)

    # 3. Direct Runoff Depth Q (mm)
    if rainfall_p_mm <= initial_abstraction_ia_mm:
        runoff_depth_q_mm = 0.0
    else:
        numerator = (rainfall_p_mm - initial_abstraction_ia_mm) ** 2
        denominator = (rainfall_p_mm - initial_abstraction_ia_mm) + retention_s_mm
        runoff_depth_q_mm = round(numerator / denominator, 2)

    # 4. Runoff Volume (m3 and Mm3)
    runoff_volume_m3 = round(runoff_depth_q_mm * catchment_area_km2 * 1000.0, 1)
    runoff_volume_mm3 = round(runoff_volume_m3 / 1e6, 3)

    # 5. Runoff Ratio (Q / P)
    runoff_coefficient = round(runoff_depth_q_mm / max(0.001, rainfall_p_mm), 3) if rainfall_p_mm > 0 else 0.0

    return {
        "base_cn": float(cn_value),
        "amc": amc,
        "effective_cn": effective_cn,
        "rainfall_p_mm": round(float(rainfall_p_mm), 2),
        "retention_s_mm": retention_s_mm,
        "initial_abstraction_ia_mm": initial_abstraction_ia_mm,
        "lambda_ratio": lambda_val,
        "runoff_depth_q_mm": runoff_depth_q_mm,
        "runoff_volume_m3": runoff_volume_m3,
        "runoff_volume_mm3": runoff_volume_mm3,
        "runoff_coefficient": runoff_coefficient,
        "catchment_area_km2": catchment_area_km2,
        "calibration_notice": "Hydrological model results are uncalibrated estimates without local stream gauge validation data."
    }


def compute_scs_runoff_hydrograph(
    rainfall_series: List[Dict[str, Any]],
    cn_value: float = 78.0,
    amc: str = "AMC_II",
    lambda_val: float = 0.20,
    catchment_area_km2: float = 1240.0,
    time_of_concentration_hr: float = 6.4
) -> Dict[str, Any]:
    """
    Computes time-series runoff hyetograph and direct runoff discharge hydrograph Q(t) in m3/s.
    """
    effective_cn = adjust_cn_for_amc(cn_value, amc)
    retention_s = (25400.0 / effective_cn) - 254.0
    ia_val = lambda_val * retention_s

    # Compute time to peak tp = 0.5 * D + 0.6 * Tc
    duration_step_hr = 1.0
    time_to_peak_tp = 0.5 * duration_step_hr + 0.6 * time_of_concentration_hr

    hydrograph_points = []
    prev_q_mm = 0.0

    for step in rainfall_series:
        p_cum = step.get("cumulative_mm", 0.0)
        t_hr = step.get("time_hr", 0)
        t_stamp = step.get("timestamp", f"{t_hr}h")

        if p_cum <= ia_val:
            cum_q_mm = 0.0
        else:
            cum_q_mm = ((p_cum - ia_val) ** 2) / ((p_cum - ia_val) + retention_s)

        inc_q_mm = max(0.0, cum_q_mm - prev_q_mm)
        prev_q_mm = cum_q_mm

        # Peak discharge for incremental runoff step using SCS Triangular Hydrograph: Qp = (0.208 * A * inc_q) / tp
        discharge_q_m3s = round((0.208 * catchment_area_km2 * inc_q_mm) / max(0.5, time_to_peak_tp), 1)

        hydrograph_points.append({
            "time_hr": t_hr,
            "timestamp": t_stamp,
            "rainfall_incremental_mm": step.get("incremental_mm", 0.0),
            "rainfall_cumulative_mm": p_cum,
            "runoff_incremental_mm": round(inc_q_mm, 2),
            "runoff_cumulative_mm": round(cum_q_mm, 2),
            "discharge_m3s": discharge_q_m3s
        })

    summary_scs = calculate_scs_cn_runoff(
        rainfall_p_mm=rainfall_series[-1].get("cumulative_mm", 0.0) if rainfall_series else 180.0,
        cn_value=cn_value,
        amc=amc,
        lambda_val=lambda_val,
        catchment_area_km2=catchment_area_km2
    )

    return {
        "summary": summary_scs,
        "time_of_concentration_hr": time_of_concentration_hr,
        "time_to_peak_tp_hr": round(time_to_peak_tp, 2),
        "peak_discharge_m3s": max(pt["discharge_m3s"] for pt in hydrograph_points),
        "hydrograph_series": hydrograph_points
    }
