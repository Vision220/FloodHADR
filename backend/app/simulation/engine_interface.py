from abc import ABC, abstractmethod
from typing import Dict, Any

class HydroEngineAdapter(ABC):
    """
    Abstract Base Class defining the contract for hydrodynamic engines (Prototype Solver, Delft3D, SPH, HEC-RAS 2D).
    """

    @abstractmethod
    def prepare_grid_and_inputs(self, dem_path: str, breach_hydrograph: Dict[str, Any]) -> str:
        """Prepare engine grid configuration."""
        pass

    @abstractmethod
    def execute_run(self, input_config_path: str) -> Dict[str, Any]:
        """Execute simulation run and return summary metrics."""
        pass

    @abstractmethod
    def parse_output_to_geojson(self, engine_output_path: str) -> Dict[str, Any]:
        """Convert native solver outputs to GeoJSON."""
        pass
