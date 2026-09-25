"""
dam_break.py - Dam Breach Formation & Outflow Hydrograph Dynamics

===============================================================================
SCIENTIFIC & MODELING ASSUMPTIONS:
1. Breach growth rate is modeled as linear trapezoid/rectangular opening over
   the specified breach formation time t_f.
2. Peak breach discharge Q_breach(t) follows Broad-Crested Weir / Froehlich hydraulics:
   Q(t) = C_d * B(t) * sqrt(g) * H_res(t)^(3/2)
3. Breach lowers local elevation barrier at the dam line gradually from dam crest
   elevation down to breach invert elevation.
===============================================================================
"""

from typing import Tuple, Dict, Any
import numpy as np


class DamBreachModel:
    """
    Simulates dam breach growth over time and calculates breach outflow release rates.
    """

    def __init__(
        self,
        dam_location: Tuple[int, int],
        breach_width: float,
        breach_formation_time: float,
        initial_reservoir_depth: float,
        cd: float = 0.57,
        g: float = 9.81
    ):
        """
        Parameters:
        -----------
        dam_location : Tuple[int, int]
            (row, col) indices of breach center cell.
        breach_width : float
            Final maximum breach width B_max in meters.
        breach_formation_time : float
            Time t_f in seconds for breach to fully develop.
        initial_reservoir_depth : float
            Initial depth H_0 of reservoir in meters.
        cd : float
            Weir discharge coefficient (default 0.57 for broad-crested breach weir).
        g : float
            Gravitational acceleration (9.81 m/s^2).
        """
        self.dam_location = dam_location
        self.breach_width_max = float(breach_width)
        self.breach_formation_time = max(1.0, float(breach_formation_time))
        self.initial_reservoir_depth = float(initial_reservoir_depth)
        self.cd = float(cd)
        self.g = float(g)

    def get_current_breach_width(self, t: float) -> float:
        """Calculate breach width B(t) at time t seconds."""
        fraction = min(1.0, max(0.0, t / self.breach_formation_time))
        return self.breach_width_max * fraction

    def compute_breach_discharge(self, t: float, current_reservoir_depth: float) -> float:
        """
        Compute instant breach discharge Q(t) in m^3/s based on weir flow equation.
        """
        b_t = self.get_current_breach_width(t)
        h_eff = max(0.0, current_reservoir_depth)
        if b_t <= 0.0 or h_eff <= 0.0:
            return 0.0
        
        # Q = C_d * B(t) * sqrt(g) * H^(1.5)
        q_outflow = self.cd * b_t * np.sqrt(self.g) * np.power(h_eff, 1.5)
        return float(q_outflow)

    def update_breach_elevation(
        self,
        dem: np.ndarray,
        t: float,
        original_dam_z: float,
        breach_invert_z: float
    ) -> float:
        """
        Lower breach cell terrain elevation dynamically as breach deepens over time.
        """
        fraction = min(1.0, max(0.0, t / self.breach_formation_time))
        current_z = original_dam_z - fraction * (original_dam_z - breach_invert_z)
        r, c = self.dam_location
        dem[r, c] = current_z
        return current_z
