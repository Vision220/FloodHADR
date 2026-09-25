from typing import List, Tuple
from app.simulation.sph.particle import SPHParticle

def step_symplectic_euler(
    fluid_particles: List[SPHParticle],
    accelerations: List[Tuple[float, float]],
    dt: float,
    domain_length_m: float = 80.0,
    floor_y_m: float = 0.5,
    restitution: float = 0.3
) -> None:
    """
    Integrates SPH particle positions and velocities over time step dt
    using Symplectic Euler scheme with reflective boundary conditions.
    """
    for idx, p in enumerate(fluid_particles):
        ax, ay = accelerations[idx]

        # 1. Update velocities (Symplectic step 1)
        p.velocity_x += ax * dt
        p.velocity_y += ay * dt

        # Velocity limiting for stability
        max_vel = 40.0
        v_mag = (p.velocity_x ** 2 + p.velocity_y ** 2) ** 0.5
        if v_mag > max_vel:
            p.velocity_x = (p.velocity_x / v_mag) * max_vel
            p.velocity_y = (p.velocity_y / v_mag) * max_vel

        # 2. Update positions (Symplectic step 2)
        p.x += p.velocity_x * dt
        p.y += p.velocity_y * dt

        # 3. Floor Boundary Collision (y = floor_y_m)
        if p.y < floor_y_m:
            p.y = floor_y_m
            p.velocity_y = -p.velocity_y * restitution
            p.velocity_x *= (1.0 - restitution * 0.5)  # Friction damping

        # 4. Left Wall Boundary Collision (x = 0.5)
        if p.x < 0.5:
            p.x = 0.5
            p.velocity_x = -p.velocity_x * restitution

        # 5. Right Wall Boundary Collision (x = domain_length_m)
        if p.x > domain_length_m:
            p.x = domain_length_m
            p.velocity_x = -p.velocity_x * restitution
