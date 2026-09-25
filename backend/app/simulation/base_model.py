from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class HydrodynamicModel(ABC):
    """
    Abstract Base Service Interface for all FloodHADR Hydrodynamic Engines.
    Establishes standardized contract across 2D Grid Solvers, SPH Particle Solvers,
    and External HPC Engines (Delft3D-FLOW, HEC-RAS 2D).
    """

    @abstractmethod
    def run(self, scenario_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Triggers hydrodynamic simulation run.
        """
        pass

    @abstractmethod
    def get_status(self, run_id: str) -> Dict[str, Any]:
        """
        Queries execution status, computation state, and progress percentage.
        """
        pass

    @abstractmethod
    def get_results(self, run_id: str) -> Dict[str, Any]:
        """
        Fetches simulation summary metrics, output hydrograph, and inundation GeoJSON layers.
        """
        pass

    @abstractmethod
    def cancel(self, run_id: str) -> bool:
        """
        Cancels active simulation run.
        """
        pass
