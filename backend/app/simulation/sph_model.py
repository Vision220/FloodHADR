from typing import Dict, Any
from app.simulation.base_model import HydrodynamicModel
from app.simulation.sph.sph_engine import sph_engine, EXPERIMENTAL_NOTICE

class ExperimentalSPHModel(HydrodynamicModel):
    """
    Experimental SPH Particle Solver Implementation of HydrodynamicModel interface.
    """

    def run(self, scenario_config: Dict[str, Any]) -> Dict[str, Any]:
        cw = scenario_config.get("column_width_m", 20.0)
        ch = scenario_config.get("column_height_m", 15.0)
        duration = scenario_config.get("total_time_sec", 5.0)
        fps = scenario_config.get("fps", 10)
        return sph_engine.run_dam_break_simulation(column_width_m=cw, column_height_m=ch, total_time_sec=duration, fps=fps)

    def get_status(self, run_id: str) -> Dict[str, Any]:
        return {
            "run_id": run_id,
            "engine": "Experimental SPH Demonstrator",
            "status": "READY",
            "progress_percent": 100,
            "is_available": True,
            "is_experimental_prototype": True,
            "notice": EXPERIMENTAL_NOTICE,
            "message": "Experimental particle SPH engine ready for free-surface flow animation."
        }

    def get_results(self, run_id: str) -> Dict[str, Any]:
        return sph_engine.run_dam_break_simulation()

    def cancel(self, run_id: str) -> bool:
        return True

experimental_sph_model = ExperimentalSPHModel()
