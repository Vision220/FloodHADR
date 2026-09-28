"""
backend/app/hec_ras/hec_ras_geometry.py

HEC-RAS Geometry Generator.
Generates native HEC-RAS 2D Geometry text files (.g01) matching FloodHADR terrain,
grid resolution, Manning roughness values, and dam structural location.
"""

import os
import json
from typing import Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class HECRASGeometryConfig:
    project_id: str = "tehri_dam_break_hecras"
    geom_id: str = "g01"
    geom_title: str = "Tehri Downstream Valley 2D Geometry"
    manning_n: float = 0.035
    dam_row: int = 2
    dam_col: int = 2
    dx: float = 25.0
    dy: float = 25.0
    output_dir: str = "data/hecras_projects/tehri_reference"


class HECRASGeometryGenerator:
    """
    Generates .g01 HEC-RAS 2D Geometry files.
    """

    def __init__(self, config: Optional[HECRASGeometryConfig] = None):
        self.config = config or HECRASGeometryConfig()

    def generate_geometry_file(self, rows: int = 30, cols: int = 30) -> Dict[str, Any]:
        """
        Writes .g01 text file formatted to HEC-RAS geometry specifications.
        """
        cfg = self.config
        os.makedirs(cfg.output_dir, exist_ok=True)
        geom_path = os.path.join(cfg.output_dir, f"{cfg.project_id}.{cfg.geom_id}")

        content = [
            f"Geom Title={cfg.geom_title}",
            f"Program Version=6.4.1",
            f"2D Area Perimeter Name=TehriValley2D",
            f"2D Area Cell Size={cfg.dx},{cfg.dy}",
            f"2D Area Manning n Default={cfg.manning_n}",
            f"2D Area Dam Location Row={cfg.dam_row},Col={cfg.dam_col}",
            f"2D Area Grid Dimensions Rows={rows},Cols={cols}",
            f"SA/2D Area N Value Region=1",
            f"Region Name=Valley Riverbed & Floodplain",
            f"Region Manning n={cfg.manning_n}",
            f"Structure Name=Tehri Dam",
            f"Structure Stationing=0.0",
            f"Structure Height=260.5",
            f"Structure Top Crest Elevation=840.0",
            f"Structure Foundation Elevation=579.0",
        ]

        geom_text = "\n".join(content)
        with open(geom_path, "w", encoding="utf-8") as f:
            f.write(geom_text)

        payload = {
            "geom_title": cfg.geom_title,
            "geom_file": f"{cfg.project_id}.{cfg.geom_id}",
            "manning_n": cfg.manning_n,
            "cell_size_x_m": cfg.dx,
            "cell_size_y_m": cfg.dy,
            "dam_location": {"row": cfg.dam_row, "col": cfg.dam_col},
            "status": "HEC-RAS GEOMETRY GENERATED"
        }
        return payload
