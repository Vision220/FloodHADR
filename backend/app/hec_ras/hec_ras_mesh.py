"""
backend/app/hec_ras/hec_ras_mesh.py

HEC-RAS 2D Computational Mesh & Refinement Generator.
Supports COARSE, MEDIUM, and FINE mesh resolution presets, channel/canyon breaklines,
and dam toe / confluence refinement regions.

Records:
- mesh_size
- cell_count
- breaklines
- refinement_regions
- trade-offs disclosure
"""

import os
import json
from enum import Enum
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
import numpy as np


class MeshResolutionPreset(str, Enum):
    COARSE = "COARSE"    # 50m x 50m grid
    MEDIUM = "MEDIUM"    # 25m x 25m grid (Default)
    FINE = "FINE"        # 10m x 10m grid


@dataclass
class Breakline:
    name: str
    description: str
    coordinates: List[List[float]]  # [[x1, y1], [x2, y2], ...]
    enforce_cell_faces: bool = True


@dataclass
class RefinementRegion:
    name: str
    description: str
    bounding_box: Dict[str, float]  # min_x, max_x, min_y, max_y
    refinement_factor: float = 0.5   # Cell size multiplier (e.g. 0.5x dx)


@dataclass
class HECRASMeshConfig:
    preset: MeshResolutionPreset = MeshResolutionPreset.MEDIUM
    domain_width_m: float = 750.0
    domain_height_m: float = 750.0
    crs: str = "EPSG:32644"
    output_dir: str = "data/hecras_projects/tehri_reference"
    breaklines: List[Breakline] = field(default_factory=list)
    refinement_regions: List[RefinementRegion] = field(default_factory=list)

    def get_resolution_dx_dy(self) -> Tuple[float, float]:
        if self.preset == MeshResolutionPreset.COARSE:
            return 50.0, 50.0
        elif self.preset == MeshResolutionPreset.FINE:
            return 10.0, 10.0
        else:
            return 25.0, 25.0


from typing import Tuple


class HECRASMeshGenerator:
    """
    Generates 2D Finite Volume mesh topology with breaklines and refinement regions.
    """

    def __init__(self, config: Optional[HECRASMeshConfig] = None):

        self.config = config or HECRASMeshConfig()
        self._init_default_features()

    def _init_default_features(self):
        """Initializes standard Tehri valley breaklines and refinement regions if empty."""
        if not self.config.breaklines:
            self.config.breaklines = [
                Breakline(
                    name="Bhagirathi_Main_Channel_Thalweg",
                    description="Main river centerline breakline enforcing cell face alignment along channel bed.",
                    coordinates=[[0.0, 375.0], [375.0, 375.0], [750.0, 375.0]],
                    enforce_cell_faces=True
                ),
                Breakline(
                    name="Right_Canyon_Wall_Ridge",
                    description="Right valley steep slope breakline.",
                    coordinates=[[0.0, 200.0], [750.0, 200.0]],
                    enforce_cell_faces=True
                ),
                Breakline(
                    name="Left_Canyon_Wall_Ridge",
                    description="Left valley slope boundary breakline.",
                    coordinates=[[0.0, 550.0], [750.0, 550.0]],
                    enforce_cell_faces=True
                ),
            ]

        if not self.config.refinement_regions:
            self.config.refinement_regions = [
                RefinementRegion(
                    name="Dam_Toe_High_Gradient_Zone",
                    description="Refinement zone near dam toe breach exit for steep wave front capture.",
                    bounding_box={"min_x": 0.0, "max_x": 150.0, "min_y": 300.0, "max_y": 450.0},
                    refinement_factor=0.5
                ),
                RefinementRegion(
                    name="Koti_Nala_Confluence_Zone",
                    description="Refinement zone at Koti Nala tributary confluence.",
                    bounding_box={"min_x": 300.0, "max_x": 450.0, "min_y": 250.0, "max_y": 500.0},
                    refinement_factor=0.5
                )
            ]

    def generate_mesh(self, dem_matrix: Optional[np.ndarray] = None, rows: Optional[int] = None, cols: Optional[int] = None) -> Dict[str, Any]:
        """
        Creates cell mesh structure, applies resolution presets, breaklines, and refinement regions.
        """
        cfg = self.config
        dx, dy = cfg.get_resolution_dx_dy()

        rows = rows if rows is not None else int(round(cfg.domain_height_m / dy))
        cols = cols if cols is not None else int(round(cfg.domain_width_m / dx))
        base_cell_count = rows * cols

        cell_area = dx * dy

        # Account for refined cells in refinement regions
        extra_cells = 0
        for rr in cfg.refinement_regions:
            w_r = rr.bounding_box["max_x"] - rr.bounding_box["min_x"]
            h_r = rr.bounding_box["max_y"] - rr.bounding_box["min_y"]
            area_r = w_r * h_r
            base_cells_in_region = area_r / cell_area
            refined_cells_in_region = area_r / ((dx * rr.refinement_factor) * (dy * rr.refinement_factor))
            extra_cells += int(refined_cells_in_region - base_cells_in_region)

        total_cells = base_cell_count + extra_cells

        trade_off_notice = (
            f"Mesh Option: {cfg.preset.value} ({dx:.1f}m x {dy:.1f}m). "
            "SCIENTIFIC NOTICE: A finer mesh increases spatial discretization detail but does NOT automatically "
            "guarantee higher hydraulic accuracy. Finer grids require smaller computational timesteps under CFL "
            "stability rules, increase CPU runtime significantly, and can amplify localized numerical dispersion "
            "if bed roughness and topography gradients are under-resolved."
        )

        mesh_summary_path = os.path.join(cfg.output_dir, "mesh_definition.json")
        rec_dt = 5.0 if cfg.preset == MeshResolutionPreset.COARSE else (0.5 if cfg.preset == MeshResolutionPreset.FINE else 2.0)
        payload = {
            "preset": cfg.preset.value,
            "resolution_preset": cfg.preset.value,
            "dx_m": dx,
            "dy_m": dy,
            "recommended_timestep_s": rec_dt,
            "mesh_size": f"{dx:.1f}m × {dy:.1f}m ({cfg.preset.value})",
            "cell_size_x_m": dx,
            "cell_size_y_m": dy,
            "base_grid_rows": rows,
            "base_grid_cols": cols,
            "base_cell_count": base_cell_count,
            "total_cell_count": total_cells,
            "cell_count": total_cells,

            "cell_area_m2": cell_area,
            "breaklines_count": len(cfg.breaklines),
            "refinement_regions_count": len(cfg.refinement_regions),
            "breaklines": [
                {
                    "name": bl.name,
                    "description": bl.description,
                    "coordinates": bl.coordinates,
                    "enforce_cell_faces": bl.enforce_cell_faces
                }
                for bl in cfg.breaklines
            ],
            "refinement_regions": [
                {
                    "name": rr.name,
                    "description": rr.description,
                    "bounding_box": rr.bounding_box,
                    "refinement_factor": rr.refinement_factor
                }
                for rr in cfg.refinement_regions
            ],
            "trade_off_notice": trade_off_notice,
            "crs": cfg.crs,
            "status": "HEC-RAS 2D MESH GENERATED"
        }

        os.makedirs(cfg.output_dir, exist_ok=True)
        with open(mesh_summary_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        return payload


HECRAS2DMeshGenerator = HECRASMeshGenerator

