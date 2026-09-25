from typing import Dict, Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.simulation.simple_flood_model import simple_flood_model
from app.simulation.sph_model import experimental_sph_model
from app.simulation.delft3d.adapter import delft3d_adapter
from app.simulation.delft3d.config_generator import Delft3DConfigGenerator
from app.simulation.delft3d.input_builder import Delft3DInputBuilder

router = APIRouter(prefix="/api/simulations/engines", tags=["Hydrodynamic Engines"])

class Delft3DConfigRequest(BaseModel):
    title: str = Field(default="Tehri PMF Overtopping Failure", description="Scenario title")
    duration_hr: float = Field(default=12.0, description="Simulation duration in hours")
    time_step_sec: float = Field(default=60.0, description="Time step size in seconds")
    breach_width_m: float = Field(default=180.0, description="Breach width in meters")
    peak_discharge_m3s: float = Field(default=64200.0, description="Peak breach flow rate")
    mannings_n: float = Field(default=0.035, description="Manning's roughness coefficient")

@router.get("/status")
async def get_all_engines_status():
    """
    Returns dynamic health, status, and environment availability for all 3 Hydrodynamic Models:
    1. Prototype 2D Model (Cellular Automata Diffusive Wave Grid Solver)
    2. Experimental SPH (Weakly Compressible Particle Solver)
    3. Delft3D - External Engine (Delft3D-FLOW Adapter)
    """
    return {
        "engines": [
            {
                "id": "GRID",
                "name": "Prototype 2D Grid Model",
                "type": "Eulerian Fixed Cartesian Grid",
                "status": "ACTIVE",
                "is_available": True,
                "badge": "2D GRID ACTIVE",
                "description": "Fast cellular automata 2D diffusive wave solver for rapid valley inundation mapping."
            },
            {
                "id": "SPH",
                "name": "Experimental SPH Demonstrator",
                "type": "Lagrangian Moving Particles",
                "status": "EXPERIMENTAL",
                "is_available": True,
                "badge": "SPH DEMONSTRATOR",
                "is_experimental": True,
                "description": "Meshfree particle-based solver for high-velocity dam breach surge wave dynamics."
            },
            {
                "id": "DELFT3D",
                "name": "Delft3D - External Engine",
                "type": "Delft3D-FLOW Shallow Water Equations",
                "status": delft3d_adapter.get_status("sys")["status"],
                "is_available": delft3d_adapter.get_status("sys")["is_available"],
                "badge": "EXTERNAL ENGINE",
                "message": delft3d_adapter.get_status("sys")["message"],
                "description": "Full 3D/2D shallow water hydrodynamic solver for HPC clusters."
            }
        ]
    }

@router.post("/delft3d/config")
async def generate_delft3d_config(req: Delft3DConfigRequest):
    """
    Generates Delft3D-FLOW Master Definition (.mdf), Grid Bathymetry (.dep),
    and Boundary Hydrograph (.bct) configuration input decks.
    """
    scenario_dict = req.model_dump()
    
    mdf_deck = Delft3DConfigGenerator.generate_mdf_file(scenario_dict)
    dep_deck = Delft3DConfigGenerator.generate_dep_file()
    bct_deck = Delft3DInputBuilder.generate_bct_file(req.peak_discharge_m3s, req.duration_hr)
    src_deck = Delft3DInputBuilder.generate_src_file()

    return {
        "status": "SUCCESS",
        "engine": "Delft3D-FLOW",
        "scenario_title": req.title,
        "delft3d_available": delft3d_adapter.get_status("sys")["is_available"],
        "notice": delft3d_adapter.get_status("sys")["message"],
        "files": {
            "mdf_filename": "tehri_run.mdf",
            "mdf_content": mdf_deck,
            "dep_filename": "tehri_valley.dep",
            "dep_content": dep_deck,
            "bct_filename": "tehri_breach.bct",
            "bct_content": bct_deck,
            "src_filename": "tehri_spillway.src",
            "src_content": src_deck
        }
    }
