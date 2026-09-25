"""
FloodHADR 2D Raster Hydrodynamic Flood Simulation Engine Package
================================================================
Modules:
- grid: DEMGrid raster terrain representation.
- initial_conditions: Initial hydraulic state & reservoir setup.
- dam_break: Dam breach growth and discharge hydraulics.
- water_propagation: 2D raster diffusive-wave flow solver.
- velocity: Hydrodynamic velocity estimation.
- inundation: Inundation masks, metrics, and envelope tracking.
- engine: FloodSimulationEngine orchestrator & SimulationResult object.
"""

from app.simulation.grid import DEMGrid
from app.simulation.initial_conditions import InitialConditions
from app.simulation.dam_break import DamBreachModel
from app.simulation.water_propagation import WaterPropagationSolver
from app.simulation.velocity import VelocityEstimator
from app.simulation.inundation import InundationTracker
from app.simulation.engine import (
    SimulationConfig,
    SimulationStepOutput,
    SimulationResult,
    FloodSimulationEngine,
)

__all__ = [
    "DEMGrid",
    "InitialConditions",
    "DamBreachModel",
    "WaterPropagationSolver",
    "VelocityEstimator",
    "InundationTracker",
    "SimulationConfig",
    "SimulationStepOutput",
    "SimulationResult",
    "FloodSimulationEngine",
]
