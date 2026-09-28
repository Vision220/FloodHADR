"""
backend/app/hec_ras/hec_ras_2d_model.py

HEC-RAS 2D Hydraulic Model Builder & Orchestrator.
Builds complete HEC-RAS 2D models supporting terrain, 2D flow area, computational mesh,
breaklines, refinement regions, Manning's n, upstream/downstream boundaries, reservoir initial condition,
dam connection, breach configuration, and HEC-RAS SWE / DWE governing equation selection.

Records complete metadata payload:
- mesh_size
- cell_count
- breaklines
- refinement_regions
- timestep
- solver
- boundary_conditions
"""

import os
import time
import json
import numpy as np
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field

from app.hec_ras.hec_ras_project import HECRASProjectGenerator, HECRASProjectConfig
from app.hec_ras.hec_ras_terrain import HECRASTerrainExporter, HECRASTerrainConfig
from app.hec_ras.hec_ras_geometry import HECRASGeometryGenerator, HECRASGeometryConfig
from app.hec_ras.hec_ras_mesh import HECRASMeshGenerator, HECRASMeshConfig, MeshResolutionPreset
from app.hec_ras.hec_ras_breach import HECRASBreachGenerator, HECRASBreachConfig
from app.hec_ras.hec_ras_plan import HECRASPlanGenerator, HECRASPlanConfig
from app.hec_ras.hec_ras_runner import HECRASRunner
from app.hec_ras.hec_ras_results import HECRASResultsParser
from app.hec_ras.hec_ras_validation import HECRASValidationSuite


@dataclass
class HECRAS2DModelConfig:
    scenario_id: str = "scen-tehri-overtop"
    scenario_title: str = "Tehri PMF Overtopping Failure"
    mesh_preset: MeshResolutionPreset = MeshResolutionPreset.MEDIUM
    equation_mode: str = "SWE"  # SWE | DWE
    solver: Optional[str] = None
    breach_width_m: float = 180.0
    breach_height_m: float = 120.0
    formation_time_hr: float = 1.5
    reservoir_level_m: float = 830.0
    reservoir_elevation_m: Optional[float] = None
    manning_n: float = 0.035
    manning_n_channel: Optional[float] = None
    manning_n_floodplain: Optional[float] = None
    manning_n_steep_bed: Optional[float] = None
    boundary_condition: str = "OPEN_OUTFLOW_NORMAL_DEPTH"
    output_dir: str = "data/hecras_projects/tehri_reference"

    def __post_init__(self):
        if self.solver is not None:
            if "DWE" in self.solver.upper():
                self.equation_mode = "DWE"
            else:
                self.equation_mode = "SWE"
        if self.reservoir_elevation_m is not None:
            self.reservoir_level_m = self.reservoir_elevation_m
        if self.manning_n_channel is not None:
            self.manning_n = self.manning_n_channel


class HECRAS2DModelBuilder:
    """
    Authoritative HEC-RAS 2D Hydraulic Model Orchestrator.
    """

    def __init__(self, config: Optional[HECRAS2DModelConfig] = None):
        self.config = config or HECRAS2DModelConfig()

    def build_2d_model(self) -> Dict[str, Any]:
        return self.build_and_run_model()

    def build_and_run_model(self) -> Dict[str, Any]:
        """
        Builds the 11 HEC-RAS 2D model components and executes/reports model status.
        """
        cfg = self.config
        t0 = time.time()
        os.makedirs(cfg.output_dir, exist_ok=True)

        # Timestep selection based on mesh preset for CFL stability
        if cfg.mesh_preset == MeshResolutionPreset.COARSE:
            dt_sec = 5.0
        elif cfg.mesh_preset == MeshResolutionPreset.FINE:
            dt_sec = 0.5
        else:
            dt_sec = 2.0

        eq_solver_short = "HEC-RAS DWE" if cfg.equation_mode.upper() == "DWE" else "HEC-RAS SWE"
        eq_solver_name = (
            "HEC-RAS SWE (Full 2D Shallow Water Equations)"
            if cfg.equation_mode.upper() == "SWE"
            else "HEC-RAS DWE (2D Diffusion Wave Equation)"
        )

        # 1. Project Generator
        prj_config = HECRASProjectConfig(
            project_id=f"hecras_2d_{cfg.scenario_id}",
            title=f"HEC-RAS 2D Model - {cfg.scenario_title}",
            output_dir=cfg.output_dir
        )
        prj_gen = HECRASProjectGenerator(prj_config)
        prj_meta = prj_gen.generate_project_file()

        # 2. Terrain Exporter
        dx_base, dy_base = (50.0, 50.0) if cfg.mesh_preset == MeshResolutionPreset.COARSE else ((10.0, 10.0) if cfg.mesh_preset == MeshResolutionPreset.FINE else (25.0, 25.0))
        cols_base = int(750.0 / dx_base)
        rows_base = int(750.0 / dy_base)

        x = np.linspace(0, 750.0, cols_base)
        y = np.linspace(0, 750.0, rows_base)
        xx, yy = np.meshgrid(x, y)
        valley_center = 375.0
        dem_matrix = np.round(1200.0 - 0.008 * xx + 0.0005 * (yy - valley_center) ** 2, 2)

        terrain_config = HECRASTerrainConfig(dx=dx_base, dy=dy_base, output_dir=cfg.output_dir)
        terrain_exp = HECRASTerrainExporter(terrain_config)
        terrain_meta = terrain_exp.export_terrain_from_matrix(dem_matrix)

        # 3. Geometry & Mesh Generators (with Breaklines & Refinement Regions)
        geom_config = HECRASGeometryConfig(
            project_id=f"hecras_2d_{cfg.scenario_id}",
            manning_n=cfg.manning_n,
            dx=dx_base,
            dy=dy_base,
            output_dir=cfg.output_dir
        )
        geom_gen = HECRASGeometryGenerator(geom_config)
        geom_meta = geom_gen.generate_geometry_file(rows=rows_base, cols=cols_base)

        mesh_config = HECRASMeshConfig(
            preset=cfg.mesh_preset,
            output_dir=cfg.output_dir
        )
        mesh_gen = HECRASMeshGenerator(mesh_config)
        mesh_meta = mesh_gen.generate_mesh(dem_matrix=dem_matrix)

        # 4. Breach Generator
        breach_config = HECRASBreachConfig(
            breach_width_m=cfg.breach_width_m,
            breach_height_m=cfg.breach_height_m,
            formation_time_hr=cfg.formation_time_hr,
            reservoir_level_m=cfg.reservoir_level_m,
            output_dir=cfg.output_dir
        )

        breach_gen = HECRASBreachGenerator(breach_config)
        breach_meta = breach_gen.generate_breach_definition()

        # 5. Plan Generator
        plan_config = HECRASPlanConfig(
            project_id=f"hecras_2d_{cfg.scenario_id}",
            governing_equations=eq_solver_name,
            computation_interval_sec=dt_sec,
            downstream_boundary=cfg.boundary_condition,
            output_dir=cfg.output_dir
        )
        plan_gen = HECRASPlanGenerator(plan_config)
        plan_meta = plan_gen.generate_plan_files(peak_discharge_m3s=breach_meta["froehlich_peak_discharge_m3s"])

        # 6. Validation Suite
        validator = HECRASValidationSuite()
        scenario_params = {
            "scenario_id": cfg.scenario_id,
            "crs": "EPSG:32644",
            "dx": dx_base,
            "dy": dy_base,
            "reservoir_level_m": cfg.reservoir_level_m,
            "breach_width_m": cfg.breach_width_m,
            "formation_time_hr": cfg.formation_time_hr,
            "manning_n": cfg.manning_n,
            "failure_mode": "OVERTOPPING"
        }
        val_report = validator.validate_parameter_alignment(scenario_params, prj_meta, breach_meta, plan_meta, terrain_meta)

        # 7. Runner & Results Parser
        runner = HECRASRunner()
        exec_result = runner.run_hecras_project(prj_meta["project_file_path"])
        parser = HECRASResultsParser(project_dir=cfg.output_dir)
        res_payload = parser.parse_results(execution_meta=exec_result)

        exec_time = round(time.time() - t0, 3)

        boundary_conditions = [
            {
                "boundary_name": "Upstream_Dam_Toe_Inflow",
                "boundary_type": "Flow Hydrograph (Dam Breach Peak Outflow)",
                "peak_discharge_m3s": breach_meta["froehlich_peak_discharge_m3s"]
            },
            {
                "boundary_name": "Downstream_Devprayag_Outflow",
                "boundary_type": "Normal Depth (Open Outflow Friction Slope S0=0.008)",
                "friction_slope": 0.008
            }
        ]

        preset_str = cfg.mesh_preset.value if hasattr(cfg.mesh_preset, "value") else str(cfg.mesh_preset)
        breakline_names = [b["name"] if isinstance(b, dict) else b for b in mesh_meta["breaklines"]]
        refinement_names = [r["name"] if isinstance(r, dict) else r for r in mesh_meta["refinement_regions"]]

        summary_model_record = {
            "status": "success",
            "model_type": "HEC-RAS 2D Hydraulic Model",
            "scenario_id": cfg.scenario_id,
            "metadata": {
                "mesh_size_m": dx_base,
                "mesh_size": mesh_meta["mesh_size"],
                "mesh_preset": preset_str,
                "cell_count": mesh_meta["cell_count"],
                "breaklines": breakline_names,
                "refinement_regions": refinement_names,
                "timestep_s": dt_sec,
                "timestep": f"{dt_sec:.1f}s",
                "solver": eq_solver_short,
                "solver_full_name": eq_solver_name,
                "boundary_conditions": {
                    "upstream": "Dam Breach Peak Hydrograph",
                    "downstream": "Normal Depth (Slope=0.005)"
                },
                "accuracy_notice": mesh_meta["trade_off_notice"]
            },
            "components": {
                "terrain": terrain_meta,
                "flow_area_2d": {"area_name": "Tehri_Downstream_Domain", "bounding_box": [0.0, 0.0, 750.0, 750.0]},
                "computational_mesh": mesh_meta,
                "breaklines": mesh_meta["breaklines"],
                "refinement_regions": mesh_meta["refinement_regions"],
                "manning_n": {"channel": cfg.manning_n, "floodplain": 0.065, "steep_bed": 0.080},
                "upstream_boundary": boundary_conditions[0],
                "downstream_boundary": boundary_conditions[1],
                "reservoir_condition": {"initial_water_level_m": cfg.reservoir_level_m},
                "dam_connection": {"dam_height_m": 260.5, "crest_length_m": 575.0},
                "breach_configuration": breach_meta
            },
            "hec_ras_project_status": exec_result["hec_ras_project_status"],
            "hec_ras_execution_status": exec_result["hec_ras_execution_status"],
            "execution_status": exec_result["hec_ras_execution_status"],
            "validation_report": val_report,
            "execution_time_sec": exec_time,
            "results_summary": res_payload
        }

        with open(os.path.join(cfg.output_dir, "hecras_2d_model_summary.json"), "w", encoding="utf-8") as f:
            json.dump(summary_model_record, f, indent=2)

        return summary_model_record

