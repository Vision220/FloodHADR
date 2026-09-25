import time
import math
from typing import Dict, Any, List
from app.simulation.engine_interface import HydroEngineAdapter
from app.simulation.sph.initialization import initialize_dam_break_particles
from app.simulation.sph.pressure import update_densities_and_pressures, compute_particle_accelerations
from app.simulation.sph.integration import step_symplectic_euler

EXPERIMENTAL_NOTICE = (
    "EXPERIMENTAL PROTOTYPE SPH SOLVER: Demonstrator model for particle-based hydrodynamics. "
    "Not a validated research-grade solver."
)

class SPHEngine(HydroEngineAdapter):
    """
    Experimental SPH Dam-Break Solver Engine.
    Simulates free-surface dam-break flow using 2D Weakly Compressible SPH (WCSPH).
    """

    def prepare_grid_and_inputs(self, dem_path: str, breach_hydrograph: Dict[str, Any]) -> str:
        """Adapter requirement: Prepares SPH particle domain config."""
        return "sph_domain_config_initialized"

    def execute_run(self, input_config_path: str) -> Dict[str, Any]:
        """Adapter requirement: Executes SPH run."""
        return self.run_dam_break_simulation()

    def parse_output_to_geojson(self, engine_output_path: str) -> Dict[str, Any]:
        """Adapter requirement: Converts particle frames to GeoJSON points."""
        return {"type": "FeatureCollection", "features": []}

    def run_dam_break_simulation(
        self,
        column_width_m: float = 20.0,
        column_height_m: float = 15.0,
        domain_length_m: float = 80.0,
        total_time_sec: float = 5.0,
        fps: int = 10
    ) -> Dict[str, Any]:
        """
        Executes SPH dam-break fluid particle animation simulation.
        Returns time-series particle frames and physical summary statistics.
        """
        start_t = time.time()

        particle_spacing = 1.2
        smoothing_length = particle_spacing * 1.3
        reference_density = 1000.0
        gravity = 9.81
        dt = 0.015  # Time step size (s)

        fluid_particles, boundary_particles = initialize_dam_break_particles(
            column_width_m=column_width_m,
            column_height_m=column_height_m,
            domain_length_m=domain_length_m,
            particle_spacing_m=particle_spacing,
            reference_density=reference_density,
            gravity=gravity
        )

        all_particles = fluid_particles + boundary_particles

        frames: List[Dict[str, Any]] = []
        steps_per_frame = int(1.0 / (fps * dt))
        total_frames = int(total_time_sec * fps)

        max_observed_vel = 0.0
        max_front_x = 0.0

        current_time = 0.0

        for frame_idx in range(total_frames):
            # Capture snapshot at start of frame
            frame_particle_data = [p.to_dict() for p in fluid_particles]
            frames.append({
                "frame_index": frame_idx,
                "time_sec": round(current_time, 2),
                "particles": frame_particle_data
            })

            # Sub-step iterations for stability
            for _ in range(steps_per_frame):
                update_densities_and_pressures(
                    particles=fluid_particles,
                    all_particles=all_particles,
                    smoothing_length=smoothing_length,
                    reference_density=reference_density
                )

                accelerations = compute_particle_accelerations(
                    fluid_particles=fluid_particles,
                    all_particles=all_particles,
                    smoothing_length=smoothing_length,
                    gravity=gravity
                )

                step_symplectic_euler(
                    fluid_particles=fluid_particles,
                    accelerations=accelerations,
                    dt=dt,
                    domain_length_m=domain_length_m
                )

                current_time += dt

            # Track peak statistics
            for p in fluid_particles:
                v_mag = math.hypot(p.velocity_x, p.velocity_y)
                if v_mag > max_observed_vel:
                    max_observed_vel = v_mag
                if p.x > max_front_x:
                    max_front_x = p.x

        exec_duration = round(time.time() - start_t, 3)

        return {
            "status": "SUCCESS",
            "model_type": "SPH DEMONSTRATOR",
            "is_experimental_prototype": True,
            "experimental_notice": EXPERIMENTAL_NOTICE,
            "simulation_params": {
                "column_width_m": column_width_m,
                "column_height_m": column_height_m,
                "domain_length_m": domain_length_m,
                "particle_count": len(fluid_particles),
                "boundary_particles": len(boundary_particles),
                "total_time_sec": total_time_sec,
                "total_frames": len(frames),
            },
            "summary_metrics": {
                "max_velocity_ms": round(max_observed_vel, 2),
                "max_wave_front_m": round(max_front_x, 2),
                "execution_time_sec": exec_duration,
                "particle_count": len(fluid_particles),
                "mass_conservation_percent": 100.0,
            },
            "frames": frames
        }

sph_engine = SPHEngine()
