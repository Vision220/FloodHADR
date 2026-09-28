"""
backend/app/simulation/dam_break.py

Authoritative Tehri Dam Breach and Dam-Break Hydrograph Engine.

Supports 6 Breach Modes:
1. PARTIAL (Capped breach width on crest)
2. RAPID (Fast formation time t_f = 0.5h)
3. SLOW (Gradual erosion t_f = 3.0h)
4. USER_DEFINED (Custom breach geometry)
5. OVERTOPPING (Top-down progressive erosion across embankment)
6. PIPING (Internal piping orifice erosion expanding into open breach)

Parameters:
- breach_width B_w (m)
- breach_bottom_elevation Z_b (m RL)
- breach_formation_time t_f (hr or sec)
- breach_start_time t_0 (hr or sec)
- side_slopes Z_s (ZH:1V)
- reservoir_level H_0 (m RL)
- reservoir_storage V_0 (Mm3)
- discharge_coefficient C_d (m^0.5/s)

Outputs:
- breach_width_vs_time B_w(t)
- breach_depth_vs_time H_b(t)
- breach_discharge_hydrograph Q_b(t)
- reservoir_drawdown H_res(t)
- released_volume V_rel(t)

All parameters carry provenance: "SCENARIO" and an uncalibrated disclaimer notice.
"""

import math
import datetime
from enum import Enum
from typing import Dict, Any, List, Optional, Tuple
import numpy as np


class BreachMode(str, Enum):
    PARTIAL = "PARTIAL"
    RAPID = "RAPID"
    SLOW = "SLOW"
    USER_DEFINED = "USER_DEFINED"
    OVERTOPPING = "OVERTOPPING"
    PIPING = "PIPING"


BREACH_MODE_DEFAULTS: Dict[str, Dict[str, Any]] = {
    "PARTIAL": {
        "mode_code": "PARTIAL",
        "description": "Partial embankment breach restricted to central spillway section.",
        "default_width_m": 60.0,
        "default_formation_time_hr": 1.5,
        "side_slopes": 0.5,
        "cd": 1.70
    },
    "RAPID": {
        "mode_code": "RAPID",
        "description": "Rapid catastrophic structural failure / rapid erosion.",
        "default_width_m": 180.0,
        "default_formation_time_hr": 0.5,
        "side_slopes": 0.5,
        "cd": 1.85
    },
    "SLOW": {
        "mode_code": "SLOW",
        "description": "Slow progressive embankment erosion.",
        "default_width_m": 120.0,
        "default_formation_time_hr": 3.0,
        "side_slopes": 1.0,
        "cd": 1.65
    },
    "OVERTOPPING": {
        "mode_code": "OVERTOPPING",
        "description": "Crest overtopping caused by extreme PMF inflow surge.",
        "default_width_m": 180.0,
        "default_formation_time_hr": 1.5,
        "side_slopes": 0.7,
        "cd": 1.75
    },
    "PIPING": {
        "mode_code": "PIPING",
        "description": "Internal piping erosion starting at low elevation expanding to full open breach.",
        "default_width_m": 150.0,
        "default_formation_time_hr": 2.0,
        "side_slopes": 0.8,
        "cd": 1.70,
        "piping_elevation_m": 720.0
    },
    "USER_DEFINED": {
        "mode_code": "USER_DEFINED",
        "description": "Custom user-configured breach geometry.",
        "default_width_m": 150.0,
        "default_formation_time_hr": 1.5,
        "side_slopes": 0.7,
        "cd": 1.70
    }
}


class DamBreachModel:
    """
    Parametric Dam Breach Formation & Outflow Hydrograph Model.
    Supports both time-series analytics and 2D grid solver interfaces.
    """

    def __init__(
        self,
        mode: BreachMode = BreachMode.OVERTOPPING,
        breach_width_m: Optional[float] = None,
        breach_bottom_elevation_m: float = 579.0, # Tehri foundation elevation
        breach_formation_time_hr: Optional[float] = None,
        breach_start_time_hr: float = 0.0,
        side_slopes: Optional[float] = None,
        reservoir_level_m: float = 830.0,
        discharge_coefficient: Optional[float] = None,
        dam_crest_elevation_m: float = 839.5,
        # Legacy/Grid solver compatibility arguments
        dam_location: Tuple[int, int] = (0, 0),
        breach_width: Optional[float] = None,
        breach_formation_time: Optional[float] = None,
        initial_reservoir_depth: Optional[float] = None,
        cd: Optional[float] = None,
        g: float = 9.81
    ):
        self.mode = mode
        defaults = BREACH_MODE_DEFAULTS.get(mode.value if hasattr(mode, "value") else str(mode), BREACH_MODE_DEFAULTS["OVERTOPPING"])

        # Determine effective breach width (prefer explicit breach_width_m, then breach_width, then default)
        if breach_width_m is not None:
            bw_val = breach_width_m
        elif breach_width is not None:
            bw_val = breach_width
        else:
            bw_val = defaults["default_width_m"]
        self.breach_width_m = float(bw_val)

        # Determine effective formation time in hours
        if breach_formation_time_hr is not None:
            tf_hr_val = breach_formation_time_hr
        elif breach_formation_time is not None:
            tf_hr_val = breach_formation_time / 3600.0 if breach_formation_time > 24.0 else breach_formation_time
        else:
            tf_hr_val = defaults["default_formation_time_hr"]
        self.breach_formation_time_hr = float(tf_hr_val)

        # Legacy compatibility attributes
        self.dam_location = dam_location
        self.breach_width_max = self.breach_width_m
        self.breach_formation_time = self.breach_formation_time_hr * 3600.0  # in seconds
        self.initial_reservoir_depth = float(initial_reservoir_depth) if initial_reservoir_depth is not None else max(10.0, reservoir_level_m - breach_bottom_elevation_m)
        self.g = float(g)

        self.breach_bottom_elevation_m = float(breach_bottom_elevation_m)
        self.breach_start_time_hr = float(breach_start_time_hr)
        self.side_slopes = float(side_slopes if side_slopes is not None else defaults["side_slopes"])
        self.reservoir_level_m = float(reservoir_level_m)

        cd_eff = discharge_coefficient if discharge_coefficient is not None else cd
        self.cd = float(cd_eff if cd_eff is not None else defaults["cd"])
        self.dam_crest_elevation_m = float(dam_crest_elevation_m)

    def get_current_breach_width(self, t: float) -> float:
        """Calculate breach width B(t) at time t in seconds."""
        t_start_sec = self.breach_start_time_hr * 3600.0
        if t < t_start_sec:
            return 0.0
        fraction = min(1.0, max(0.0, (t - t_start_sec) / self.breach_formation_time))
        return round(self.breach_width_max * fraction, 2)

    def compute_breach_discharge(self, t: float, current_reservoir_depth: float) -> float:
        """
        Compute instant breach discharge Q(t) in m^3/s based on weir flow equation.
        Accepts t in seconds and current_reservoir_depth in meters.
        """
        b_t = self.get_current_breach_width(t)
        h_eff = max(0.0, float(current_reservoir_depth))
        if b_t <= 0.0 or h_eff <= 0.0:
            return 0.0
        
        q_rect = self.cd * b_t * math.pow(h_eff, 1.5)
        q_tri = 1.35 * self.side_slopes * math.pow(h_eff, 2.5)
        return round(float(q_rect + q_tri), 1)

    def update_breach_elevation(
        self,
        dem: np.ndarray,
        t: float,
        original_dam_z: float,
        breach_invert_z: float
    ) -> float:
        """
        Lower breach cell terrain elevation dynamically as breach deepens over time.
        """
        t_start_sec = self.breach_start_time_hr * 3600.0
        if t < t_start_sec:
            current_z = original_dam_z
        else:
            fraction = min(1.0, max(0.0, (t - t_start_sec) / self.breach_formation_time))
            current_z = original_dam_z - fraction * (original_dam_z - breach_invert_z)
        r, c = self.dam_location
        if 0 <= r < dem.shape[0] and 0 <= c < dem.shape[1]:
            dem[r, c] = current_z
        return current_z

    def calculate_breach_hydrograph(
        self,
        simulation_duration_hr: float = 12.0,
        timestep_sec: float = 600.0  # 10-minute timesteps
    ) -> Dict[str, Any]:
        """
        Calculates breach growth and outflow hydrograph time-series.
        Returns B_w(t), H_b(t), Q_b(t), H_res(t), and V_rel(t) time-series arrays.
        """
        from app.simulation.reservoir_operation_model import TehriReservoirHypsometry

        total_steps = int(max(1, (simulation_duration_hr * 3600.0) / timestep_sec))
        t_start_sec = self.breach_start_time_hr * 3600.0
        t_form_sec = self.breach_formation_time  # in seconds

        initial_storage_mm3 = TehriReservoirHypsometry.elevation_to_storage(self.reservoir_level_m)
        current_storage_mm3 = initial_storage_mm3
        current_level_m = self.reservoir_level_m

        width_series: List[float] = []
        depth_series: List[float] = []
        discharge_series: List[float] = []
        level_series: List[float] = []
        released_vol_series: List[float] = []
        time_series: List[Dict[str, Any]] = []

        total_released_m3 = 0.0

        for i in range(total_steps):
            t_sec = i * timestep_sec
            t_hr = round(t_sec / 3600.0, 2)
            t_disp = f"{int(t_hr):02d}:{int((t_hr % 1)*60):02d}:00"

            if t_sec < t_start_sec:
                # Prior to breach start time
                b_t = 0.0
                z_b_t = self.dam_crest_elevation_m
                h_b_t = 0.0
                q_breach = 0.0
            else:
                # Breach formation phase
                tau_sec = t_sec - t_start_sec
                fraction = min(1.0, tau_sec / t_form_sec)

                if self.mode == BreachMode.PIPING and fraction < 0.3:
                    # Early piping phase: circular pipe expansion at Z_pipe = 720m
                    z_pipe = 720.0
                    pipe_radius = max(0.2, fraction * 12.0)
                    area_pipe = math.pi * (pipe_radius ** 2)
                    head_pipe = max(0.0, current_level_m - z_pipe)
                    q_breach = round(0.60 * area_pipe * math.sqrt(2.0 * 9.81 * head_pipe), 1)
                    
                    b_t = round(pipe_radius * 2.0, 2)
                    z_b_t = z_pipe
                    h_b_t = round(self.dam_crest_elevation_m - z_b_t, 2)
                else:
                    # Trapezoidal open weir breach phase
                    b_t = round(self.breach_width_m * fraction, 2)
                    z_b_t = round(self.dam_crest_elevation_m - fraction * (self.dam_crest_elevation_m - self.breach_bottom_elevation_m), 2)
                    h_b_t = round(self.dam_crest_elevation_m - z_b_t, 2)

                    h_eff = max(0.0, current_level_m - z_b_t)
                    if b_t > 0.0 and h_eff > 0.0:
                        # Q_breach = Cd * B_w * h^1.5 + Cs * Z_s * h^2.5
                        q_rect = self.cd * b_t * math.pow(h_eff, 1.5)
                        q_tri = 1.35 * self.side_slopes * math.pow(h_eff, 2.5)
                        q_breach = round(q_rect + q_tri, 1)
                    else:
                        q_breach = 0.0

            # Mass Balance: update reservoir volume & water level
            vol_out_m3 = q_breach * timestep_sec
            total_released_m3 += vol_out_m3
            vol_out_mm3 = vol_out_m3 / 1e6

            current_storage_mm3 = max(0.0, current_storage_mm3 - vol_out_mm3)
            current_level_m = TehriReservoirHypsometry.storage_to_elevation(current_storage_mm3)

            width_series.append(b_t)
            depth_series.append(h_b_t)
            discharge_series.append(q_breach)
            level_series.append(round(current_level_m, 2))
            released_vol_series.append(round(total_released_m3 / 1e6, 3))

            time_series.append({
                "time_sec": t_sec,
                "time_hr": t_hr,
                "timestamp": t_disp,
                "breach_width_m": b_t,
                "breach_depth_m": h_b_t,
                "discharge_m3s": q_breach,
                "reservoir_level_m": round(current_level_m, 2),
                "released_volume_mm3": round(total_released_m3 / 1e6, 3)
            })

        max_q = max(discharge_series) if discharge_series else 0.0
        max_q_time = time_series[discharge_series.index(max_q)]["time_hr"] if discharge_series else 0.0

        return {
            "mode": self.mode.value if hasattr(self.mode, "value") else str(self.mode),
            "provenance": "SCENARIO",
            "calibration_notice": "SCENARIO ESTIMATE: Uncalibrated parametric breach model. Breach parameters represent scenario assumptions and require post-event field calibration data.",
            "inputs": {
                "breach_width_m": self.breach_width_m,
                "breach_bottom_elevation_m": self.breach_bottom_elevation_m,
                "breach_formation_time_hr": self.breach_formation_time_hr,
                "breach_start_time_hr": self.breach_start_time_hr,
                "side_slopes": self.side_slopes,
                "reservoir_level_m": self.reservoir_level_m,
                "discharge_coefficient": self.cd
            },
            "summary_metrics": {
                "peak_discharge_m3s": max_q,
                "time_to_peak_hr": max_q_time,
                "final_breach_width_m": max(width_series),
                "final_breach_depth_m": max(depth_series),
                "total_released_volume_mm3": round(total_released_m3 / 1e6, 2),
                "reservoir_drawdown_m": round(self.reservoir_level_m - min(level_series), 2)
            },
            "time_series": time_series,
            "summary_arrays": {
                "breach_width": width_series,
                "breach_depth": depth_series,
                "breach_discharge": discharge_series,
                "reservoir_drawdown": level_series,
                "released_volume": released_vol_series
            }
        }


def run_authoritative_dam_break_simulation(
    mode: str = "OVERTOPPING",
    breach_width_m: float = 180.0,
    breach_formation_time_hr: float = 1.5,
    reservoir_level_m: float = 830.0,
    side_slopes: float = 0.7,
    discharge_coefficient: float = 1.70,
    simulation_duration_hr: float = 12.0
) -> Dict[str, Any]:
    """
    Executes authoritative Dam Breach Model and returns complete time-series hydrograph results.
    Guarantees that changing width, formation time, or reservoir level changes hydrograph outputs.
    """
    try:
        mode_enum = BreachMode[mode.upper()]
    except KeyError:
        mode_enum = BreachMode.USER_DEFINED

    model = DamBreachModel(
        mode=mode_enum,
        breach_width_m=breach_width_m,
        breach_formation_time_hr=breach_formation_time_hr,
        reservoir_level_m=reservoir_level_m,
        side_slopes=side_slopes,
        discharge_coefficient=discharge_coefficient
    )

    res = model.calculate_breach_hydrograph(simulation_duration_hr=simulation_duration_hr)
    return res
