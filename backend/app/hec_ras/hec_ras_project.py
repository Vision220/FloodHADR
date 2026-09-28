"""
backend/app/hec_ras/hec_ras_project.py

HEC-RAS Project Generator.
Generates native USACE HEC-RAS project (.prj) definition files linked to geometry,
terrain, plan, and unsteady flow files.
"""

import os
import json
import datetime
from typing import Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class HECRASProjectConfig:
    project_id: str = "tehri_dam_break_hecras"
    title: str = "Tehri Dam Break HEC-RAS 2D Reference Model"
    units: str = "SI Units"  # SI Units | English Units
    crs: str = "EPSG:32644"  # WGS 84 / UTM Zone 44N
    output_dir: str = "data/hecras_projects/tehri_reference"
    plan_file: str = "p01"
    geom_file: str = "g01"
    unsteady_file: str = "u01"
    terrain_file: str = "tehri_terrain.hdf"


class HECRASProjectGenerator:
    """
    Generates standard HEC-RAS (.prj) project text files.
    """

    def __init__(self, config: Optional[HECRASProjectConfig] = None):
        self.config = config or HECRASProjectConfig()

    def generate_project_file(self) -> Dict[str, Any]:
        """
        Creates the .prj project file and returns project metadata.
        """
        cfg = self.config
        os.makedirs(cfg.output_dir, exist_ok=True)
        prj_path = os.path.join(cfg.output_dir, f"{cfg.project_id}.prj")

        content = [
            f"Proj Title={cfg.title}",
            f"Current Plan={cfg.plan_file}",
            f"Default End Header=",
            f"Geom File={cfg.geom_file}",
            f"Unsteady File={cfg.unsteady_file}",
            f"Plan File={cfg.plan_file}",
            f"Y Axis Title=",
            f"X Axis Title=",
            f"Units={cfg.units}",
            f"Spatial Reference System={cfg.crs}",
            f"Terrain Raster={cfg.terrain_file}",
            f"Description=FloodHADR v2 HEC-RAS 2D Hydrodynamic Benchmark Reference Model for Tehri Dam Break Scenario.",
            f"Project Date={datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%SZ')}",
        ]

        prj_text = "\n".join(content)
        with open(prj_path, "w", encoding="utf-8") as f:
            f.write(prj_text)

        metadata_path = os.path.join(cfg.output_dir, "project_metadata.json")
        meta_payload = {
            "project_id": cfg.project_id,
            "title": cfg.title,
            "units": cfg.units,
            "crs": cfg.crs,
            "project_file_path": os.path.abspath(prj_path),
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "status": "HEC-RAS PROJECT GENERATED",
            "files": {
                "project": f"{cfg.project_id}.prj",
                "geometry": f"{cfg.project_id}.{cfg.geom_file}",
                "unsteady": f"{cfg.project_id}.{cfg.unsteady_file}",
                "plan": f"{cfg.project_id}.{cfg.plan_file}",
                "terrain": cfg.terrain_file
            }
        }

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(meta_payload, f, indent=2)

        return meta_payload
