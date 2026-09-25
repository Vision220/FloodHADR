from dataclasses import dataclass, asdict
from typing import Dict, Any

@dataclass
class SPHParticle:
    """
    SPH Particle Data Structure for 2D/3D Dam-Break Flow.
    Contains spatial position, velocity components, density, pressure, mass, and type.
    """
    id: int
    x: float
    y: float
    z: float
    velocity_x: float
    velocity_y: float
    density: float
    pressure: float
    mass: float
    particle_type: str = "FLUID"  # "FLUID" or "BOUNDARY"

    def to_dict(self) -> Dict[str, Any]:
        """Serializes particle state to dictionary."""
        return asdict(self)
