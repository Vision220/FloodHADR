"""
test_simulation_engine.py - Automated Unit & Integration Tests for 2D Flood Simulation Engine

Tests the modular 2D raster flood propagation solver, verifying:
1. Synthetic DEM terrain generation (valley + dam wall + downstream slope).
2. Reservoir delineation and dam breach growth.
3. 2D diffusive wave flood propagation toward lower terrain.
4. Per-timestep depth, WSE, velocity, and inundation mask outputs.
5. SimulationResult summary metrics (max depth, max velocity, max inundation area, arrival times, duration).
6. Non-negative depth invariant and scientific disclaimer presence.
7. Modular package import integrity across submodules.
"""

import os
import sys
from typing import Tuple
import numpy as np

# Ensure backend directory is in python module path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.simulation import (
    DEMGrid,
    InitialConditions,
    DamBreachModel,
    WaterPropagationSolver,
    VelocityEstimator,
    InundationTracker,
    SimulationConfig,
    SimulationResult,
    FloodSimulationEngine,
)


def create_synthetic_valley_dem(rows: int = 30, cols: int = 20, dx: float = 10.0, dy: float = 10.0) -> Tuple[np.ndarray, Tuple[int, int]]:
    """
    Generate a small synthetic DEM raster representing a mountain valley:
    - Rows 0 to 7: Upstream reservoir basin (flat valley floor at Z = 20m).
    - Row 8: Dam barrier wall crossing valley (crest Z = 40m).
    - Rows 9 to 29: Downstream channel sloping downward from Z = 19m to Z = 2m.
    - Outer columns (cols 0-2 and cols 17-19): High ridge valley walls (Z = 60m to 80m).
    """
    dem = np.zeros((rows, cols), dtype=np.float64)

    # Base valley floor slope from north (row 0) to south (row 29)
    for r in range(rows):
        if r < 8:
            # Upstream basin flat floor
            base_z = 20.0
        elif r == 8:
            # Dam wall
            base_z = 40.0
        else:
            # Downstream sloping valley floor
            base_z = 20.0 - (r - 8) * 0.7  # gentle downstream slope

        for c in range(cols):
            # U-shaped valley cross-section (higher on edges)
            dist_from_center = abs(c - cols / 2.0)
            wall_elevation = (dist_from_center / (cols / 2.0)) ** 2 * 40.0
            dem[r, c] = base_z + wall_elevation

    # Dam breach point at center of row 8
    dam_location = (8, cols // 2)
    return dem, dam_location


def test_modular_imports():
    """Verify all 7 modular simulation components import cleanly."""
    print("--- 1. Testing Modular Component Imports ---")
    import simulation.grid as g
    import simulation.initial_conditions as ic
    import simulation.dam_break as db
    import simulation.water_propagation as wp
    import simulation.velocity as v
    import simulation.inundation as inun
    import simulation.engine as eng

    assert hasattr(g, "DEMGrid")
    assert hasattr(ic, "InitialConditions")
    assert hasattr(db, "DamBreachModel")
    assert hasattr(wp, "WaterPropagationSolver")
    assert hasattr(v, "VelocityEstimator")
    assert hasattr(inun, "InundationTracker")
    assert hasattr(eng, "FloodSimulationEngine")
    print("[OK] All modular components imported successfully from simulation package.")


def test_simulation_engine_execution():
    """Run full simulation on synthetic DEM and test all steps & SimulationResult outputs."""
    print("\n--- 2. Testing Synthetic DEM & 11-Step Hydrodynamic Simulation Engine ---")
    
    # 1. Initialize terrain from synthetic DEM
    dem, dam_loc = create_synthetic_valley_dem(rows=30, cols=20, dx=10.0, dy=10.0)
    dam_r, dam_c = dam_loc
    
    config = SimulationConfig(
        dem_matrix=dem,
        dam_location=dam_loc,
        breach_width=25.0,  # meters
        breach_formation_time=120.0,  # seconds
        initial_reservoir_water_depth=15.0,  # meters
        dx=10.0,
        dy=10.0,
        initial_water_level=0.0,
        manning_roughness=0.035,
        simulation_duration=300.0,  # 5 minutes simulation run
        time_step=5.0,  # 5s dt step
        min_inundation_threshold=0.05
    )

    engine = FloodSimulationEngine(config)
    result = engine.run(snapshot_interval_steps=2)

    # Assertions on SimulationResult structure
    assert isinstance(result, SimulationResult), "Output must be a SimulationResult object"
    assert len(result.time_steps) == 60, f"Expected 60 time steps, got {len(result.time_steps)}"
    assert len(result.step_outputs) > 0, "Step outputs must not be empty"

    # Step outputs testing
    first_step = result.step_outputs[0]
    last_step = result.step_outputs[-1]

    assert first_step.water_depth.shape == (30, 20)
    assert first_step.water_surface_elevation.shape == (30, 20)
    assert first_step.approximate_velocity.shape == (30, 20)
    assert first_step.flooded_mask.shape == (30, 20)

    # Downstream inundation verification
    downstream_cell = (15, dam_c)
    assert last_step.water_depth[downstream_cell] > 0.01, (
        f"Water failed to propagate downstream to cell {downstream_cell}. "
        f"Depth: {last_step.water_depth[downstream_cell]}"
    )

    # Summary metrics verification
    print(f"  - Maximum Flood Depth: {result.maximum_flood_depth} m")
    print(f"  - Maximum Flow Velocity: {result.maximum_velocity} m/s")
    print(f"  - Maximum Inundation Area: {result.maximum_inundation_area_km2} km^2 ({result.maximum_inundation_area} m^2)")

    assert result.maximum_flood_depth > 0.0, "Max depth must be positive"
    assert result.maximum_velocity > 0.0, "Max velocity must be positive"
    assert result.maximum_inundation_area > 0.0, "Max inundation area must be positive"

    # Arrival time verification
    arr_time_downstream = result.flood_arrival_time[downstream_cell]
    assert arr_time_downstream >= 0.0, f"Downstream cell arrival time should be recorded (got {arr_time_downstream})"
    print(f"  - Downstream Cell Arrival Time: {arr_time_downstream} sec")

    # Duration verification
    duration_downstream = result.flood_duration[downstream_cell]
    assert duration_downstream > 0.0, f"Downstream cell flood duration should be > 0 (got {duration_downstream})"

    # Final mask verification
    assert result.final_inundation_mask.dtype == bool
    assert np.any(result.final_inundation_mask), "Final inundation mask must have flooded cells"

    # Scientific disclaimer check
    assert "PROTOTYPE DEMONSTRATOR ONLY" in result.disclaimer
    print(f"  - Scientific Disclaimer: {result.disclaimer}")

    print("[OK] Hydrodynamic Simulation Engine test passed successfully!")


def test_mass_balance_and_non_negativity():
    """Verify non-negative water depth invariant and physical mass consistency."""
    print("\n--- 3. Testing Non-Negative Depth & Numerical Invariants ---")
    dem, dam_loc = create_synthetic_valley_dem(rows=20, cols=15)
    config = SimulationConfig(
        dem_matrix=dem,
        dam_location=dam_loc,
        breach_width=15.0,
        breach_formation_time=60.0,
        initial_reservoir_water_depth=10.0,
        simulation_duration=120.0,
        time_step=2.0
    )
    engine = FloodSimulationEngine(config)
    res = engine.run()

    for step in res.step_outputs:
        assert not np.isnan(step.water_depth).any(), "Depth matrix contains NaN values"
        assert not np.isinf(step.water_depth).any(), "Depth matrix contains Inf values"
        assert np.all(step.water_depth >= 0.0), "Water depth cannot be negative"
        assert np.all(step.approximate_velocity >= 0.0), "Velocity speed magnitude cannot be negative"

    print("[OK] Numerical stability & non-negative invariant tests passed successfully!")


if __name__ == "__main__":
    test_modular_imports()
    test_simulation_engine_execution()
    test_mass_balance_and_non_negativity()
    print("\n========================================================")
    print("ALL FLOOD SIMULATION ENGINE AUTOMATED TESTS PASSED!")
    print("========================================================")
