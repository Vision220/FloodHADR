from typing import List, Tuple
import math
from app.simulation.sph.particle import SPHParticle

def initialize_dam_break_particles(
    column_width_m: float = 20.0,
    column_height_m: float = 15.0,
    domain_length_m: float = 80.0,
    particle_spacing_m: float = 1.0,
    reference_density: float = 1000.0,
    gravity: float = 9.81
) -> Tuple[List[SPHParticle], List[SPHParticle]]:
    """
    Initializes SPH particles for classic 2D dam-break benchmark scenario.
    
    - Fluid Particles: Form a rectangular water column behind dam wall (x = 0 to column_width_m).
    - Boundary Particles: Form rigid bottom floor (y = 0) and left retention wall (x = 0).
    """
    fluid_particles: List[SPHParticle] = []
    boundary_particles: List[SPHParticle] = []
    
    particle_mass = reference_density * (particle_spacing_m ** 2)
    p_id = 0

    # 1. Generate Fluid Column Particles
    nx = int(column_width_m / particle_spacing_m)
    ny = int(column_height_m / particle_spacing_m)

    for iy in range(ny):
        y = 0.5 * particle_spacing_m + iy * particle_spacing_m
        hydrostatic_depth = max(0.0, column_height_m - y)
        pressure = reference_density * gravity * hydrostatic_depth

        for ix in range(nx):
            x = 0.5 * particle_spacing_m + ix * particle_spacing_m
            p = SPHParticle(
                id=p_id,
                x=x,
                y=y,
                z=0.0,
                velocity_x=0.0,
                velocity_y=0.0,
                density=reference_density,
                pressure=pressure,
                mass=particle_mass,
                particle_type="FLUID"
            )
            fluid_particles.append(p)
            p_id += 1

    # 2. Generate Rigid Boundary Particles (Floor & Walls)
    # Floor boundary
    n_floor = int(domain_length_m / (particle_spacing_m * 0.5))
    for i in range(n_floor):
        bx = i * (particle_spacing_m * 0.5)
        by = 0.0
        boundary_particles.append(
            SPHParticle(
                id=p_id,
                x=bx,
                y=by,
                z=0.0,
                velocity_x=0.0,
                velocity_y=0.0,
                density=reference_density,
                pressure=0.0,
                mass=particle_mass * 1.5,
                particle_type="BOUNDARY"
            )
        )
        p_id += 1

    # Left wall boundary
    n_wall = int((column_height_m + 5.0) / (particle_spacing_m * 0.5))
    for j in range(n_wall):
        bx = 0.0
        by = j * (particle_spacing_m * 0.5)
        boundary_particles.append(
            SPHParticle(
                id=p_id,
                x=bx,
                y=by,
                z=0.0,
                velocity_x=0.0,
                velocity_y=0.0,
                density=reference_density,
                pressure=0.0,
                mass=particle_mass * 1.5,
                particle_type="BOUNDARY"
            )
        )
        p_id += 1

    return fluid_particles, boundary_particles
