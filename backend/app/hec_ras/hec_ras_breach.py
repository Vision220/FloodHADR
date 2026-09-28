"""
backend/app/hec_ras/hec_ras_breach.py

HEC-RAS Dam Breach Parameter Generator.
Generates USACE HEC-RAS Dam Structure & Breach Data definitions using identical
breach parameters, initial reservoir elevations, and formation times as FloodHADR.
"""

import os
import json
import math
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class HECRASBreachConfig:
    breach_width_m: float = 180.0
    breach_height_m: float = 120.0
    formation_time_hr: float = 1.5
    reservoir_level_m: float = 830.0
    dam_foundation_elev_m: float = 579.0
    breach_bottom_elev_m: float = 579.0
    side_slopes: float = 0.5
    failure_mode: str = "OVERTOPPING"  # OVERTOPPING | PIPING | RAPID | SLOW | PARTIAL
    discharge_coeff: float = 1.7
    output_dir: str = "data/hecras_projects/tehri_reference"


class HECRASBreachGenerator:
    """
    Generates HEC-RAS Dam Breach parameters and Froehlich peak discharge estimates.
    """

    def __init__(self, config: Optional[HECRASBreachConfig] = None):
        self.config = config or HECRASBreachConfig()

    def generate_breach_data(self) -> Dict[str, Any]:
        return self.generate_breach_definition()

    def generate_breach_definition(self) -> Dict[str, Any]:
        """
        Calculates HEC-RAS breach parameters and peak outflow hydrograph inputs.
        """
        cfg = self.config
        os.makedirs(cfg.output_dir, exist_ok=True)

        dam_head_m = max(10.0, cfg.reservoir_level_m - cfg.dam_foundation_elev_m)
        v_storage_m3 = (3540.0 * 1e6) * math.pow(dam_head_m / 251.0, 2.2)

        # USACE HEC-RAS Froehlich Dam Breach Peak Outflow Formula
        q_peak_m3s = round(
            0.607 * math.pow(v_storage_m3, 0.295) * math.pow(dam_head_m, 1.24) * (cfg.breach_width_m / 150.0),
            1
        )

        breach_text = [
            f"Dam Breach Name=Tehri Dam Breach",
            f"Breach Width={cfg.breach_width_m}",
            f"Breach Bottom Elevation={cfg.breach_bottom_elev_m}",
            f"Breach Formation Time={cfg.formation_time_hr}",
            f"Breach Side Slopes={cfg.side_slopes}",
            f"Failure Mode={cfg.failure_mode}",
            f"Reservoir Elevation={cfg.reservoir_level_m}",
            f"Calculated Peak Outflow={q_peak_m3s}",
        ]

        breach_file_path = os.path.join(cfg.output_dir, "breach_parameters.txt")
        with open(breach_file_path, "w", encoding="utf-8") as f:
            f.write("\n".join(breach_text))

        payload = {
            "breach_width_m": cfg.breach_width_m,
            "breach_height_m": cfg.breach_height_m,
            "formation_time_hr": cfg.formation_time_hr,
            "reservoir_level_m": cfg.reservoir_level_m,
            "breach_bottom_elevation_m": cfg.breach_bottom_elev_m,
            "side_slopes": cfg.side_slopes,
            "failure_mode": cfg.failure_mode,
            "discharge_coefficient": cfg.discharge_coeff,
            "reservoir_head_m": dam_head_m,
            "reservoir_storage_m3": v_storage_m3,
            "froehlich_peak_discharge_m3s": q_peak_m3s,
            "provenance": "SCENARIO_PARAMETRIC",
            "status": "HEC-RAS BREACH GENERATED"
        }

        with open(os.path.join(cfg.output_dir, "breach_metadata.json"), "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        return payload
