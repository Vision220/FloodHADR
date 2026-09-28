"""
backend/app/hec_ras/hec_ras_plan.py

HEC-RAS Plan & Unsteady Flow Generator.
Generates native USACE HEC-RAS Plan (.p01) and Unsteady Flow (.u01) control files,
configuring simulation time windows, computation intervals, governing equations (SWE vs DWE),
and boundary conditions.
"""

import os
import json
import datetime
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class HECRASPlanConfig:
    project_id: str = "tehri_dam_break_hecras"
    plan_id: str = "p01"
    unsteady_id: str = "u01"
    plan_title: str = "Tehri 2D Unsteady Dam Break Plan"
    governing_equations: str = "Full 2D Shallow Water Equations (SWE)"  # SWE | DWE
    computation_interval_sec: float = 2.0
    mapping_interval_min: float = 15.0
    simulation_duration_hr: float = 6.0
    downstream_boundary: str = "OPEN_OUTFLOW_NORMAL_DEPTH"
    friction_slope: float = 0.008
    output_dir: str = "data/hecras_projects/tehri_reference"


class HECRASPlanGenerator:
    """
    Generates HEC-RAS Plan (.p01) and Unsteady Flow (.u01) control files.
    """

    def __init__(self, config: Optional[HECRASPlanConfig] = None):
        self.config = config or HECRASPlanConfig()

    def generate_plan_files(self, peak_discharge_m3s: float = 1260404.3) -> Dict[str, Any]:
        """
        Creates .p01 and .u01 configuration files.
        """
        cfg = self.config
        os.makedirs(cfg.output_dir, exist_ok=True)

        plan_path = os.path.join(cfg.output_dir, f"{cfg.project_id}.{cfg.plan_id}")
        unsteady_path = os.path.join(cfg.output_dir, f"{cfg.project_id}.{cfg.unsteady_id}")

        now = datetime.datetime.now(datetime.timezone.utc)
        start_str = now.strftime("%d%b%Y 00:00")
        end_time = now + datetime.timedelta(hours=cfg.simulation_duration_hr)
        end_str = end_time.strftime("%d%b%Y %H:00")

        plan_content = [
            f"Plan Title={cfg.plan_title}",
            f"Short Identifier=p01",
            f"Simulation Date={start_str},{end_str}",
            f"Computation Interval={int(cfg.computation_interval_sec)}SEC",
            f"Mapping Interval={int(cfg.mapping_interval_min)}MIN",
            f"2D Equations={cfg.governing_equations}",
            f"2D Matrix Solver=Direct",
            f"2D Max Iterations=20",
            f"2D Convergence Tolerance=0.003",
        ]

        unsteady_content = [
            f"Unsteady Title=Tehri Inflow Hydrograph & Boundary Conditions",
            f"Boundary Location=Tehri Dam Toe",
            f"Boundary Type=Flow Hydrograph",
            f"Peak Discharge M3S={peak_discharge_m3s}",
            f"Downstream Boundary Location=Devprayag Outflow",
            f"Downstream Boundary Type=Normal Depth",
            f"Friction Slope={cfg.friction_slope}",
        ]

        with open(plan_path, "w", encoding="utf-8") as f:
            f.write("\n".join(plan_content))

        with open(unsteady_path, "w", encoding="utf-8") as f:
            f.write("\n".join(unsteady_content))

        payload = {
            "plan_title": cfg.plan_title,
            "plan_file": f"{cfg.project_id}.{cfg.plan_id}",
            "unsteady_file": f"{cfg.project_id}.{cfg.unsteady_id}",
            "governing_equations": cfg.governing_equations,
            "computation_interval_sec": cfg.computation_interval_sec,
            "simulation_duration_hr": cfg.simulation_duration_hr,
            "downstream_boundary": cfg.downstream_boundary,
            "status": "HEC-RAS PLAN GENERATED"
        }

        with open(os.path.join(cfg.output_dir, "plan_metadata.json"), "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        return payload
