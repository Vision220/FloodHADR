from typing import List, Tuple
import math
from app.simulation.sph.particle import SPHParticle
from app.simulation.sph.kernel import cubic_spline_kernel, cubic_spline_kernel_grad

def compute_tait_pressure(
    density: float,
    reference_density: float = 1000.0,
    speed_of_sound: float = 30.0,
    gamma: float = 7.0
) -> float:
    """
    Computes fluid pressure using Tait's Equation of State (EOS) for Weakly Compressible SPH:
    P = B * [ (rho / rho_0)^gamma - 1 ]
    where B = (rho_0 * c_0^2) / gamma.
    """
    B = (reference_density * (speed_of_sound ** 2)) / gamma
    ratio = max(0.8, density / reference_density)
    pressure = B * ((ratio ** gamma) - 1.0)
    return max(0.0, pressure)  # Negative pressure clamping for stability

def update_densities_and_pressures(
    particles: List[SPHParticle],
    all_particles: List[SPHParticle],
    smoothing_length: float,
    reference_density: float = 1000.0,
    speed_of_sound: float = 30.0
) -> None:
    """Updates SPH particle density summation and Tait's EOS pressure."""
    h = smoothing_length

    for p_i in particles:
        rho_i = 0.0
        for p_j in all_particles:
            dx = p_i.x - p_j.x
            dy = p_i.y - p_j.y
            r = math.hypot(dx, dy)
            if r <= 2.0 * h:
                W = cubic_spline_kernel(r, h)
                rho_i += p_j.mass * W

        p_i.density = max(reference_density * 0.8, rho_i)
        p_i.pressure = compute_tait_pressure(p_i.density, reference_density, speed_of_sound)

def compute_particle_accelerations(
    fluid_particles: List[SPHParticle],
    all_particles: List[SPHParticle],
    smoothing_length: float,
    gravity: float = 9.81,
    viscosity_alpha: float = 0.1,
    speed_of_sound: float = 30.0
) -> List[Tuple[float, float]]:
    """
    Computes net acceleration (ax, ay) for each fluid particle combining:
    1. Symmetric SPH Pressure gradient force
    2. Artificial Monaghan Viscosity
    3. External Gravity body force
    """
    h = smoothing_length
    accelerations: List[Tuple[float, float]] = []

    for p_i in fluid_particles:
        ax = 0.0
        ay = -gravity  # Gravity body force acting downwards

        p_term_i = p_i.pressure / (p_i.density ** 2)

        for p_j in all_particles:
            if p_i.id == p_j.id:
                continue

            dx = p_i.x - p_j.x
            dy = p_i.y - p_j.y
            r = math.hypot(dx, dy)

            if 1e-6 < r <= 2.0 * h:
                grad_x, grad_y = cubic_spline_kernel_grad(dx, dy, r, h)
                p_term_j = p_j.pressure / (p_j.density ** 2)

                # Monaghan Artificial Viscosity Pi_ij
                dvx = p_i.velocity_x - p_j.velocity_x
                dvy = p_i.velocity_y - p_j.velocity_y
                dot_vr = dvx * dx + dvy * dy

                pi_ij = 0.0
                if dot_vr < 0.0:
                    mu_ij = (h * dot_vr) / ((r ** 2) + 0.01 * (h ** 2))
                    rho_bar = 0.5 * (p_i.density + p_j.density)
                    pi_ij = (-viscosity_alpha * speed_of_sound * mu_ij) / rho_bar

                # Net SPH momentum acceleration sum
                factor = -p_j.mass * (p_term_i + p_term_j + pi_ij)
                ax += factor * grad_x
                ay += factor * grad_y

        accelerations.append((ax, ay))

    return accelerations
