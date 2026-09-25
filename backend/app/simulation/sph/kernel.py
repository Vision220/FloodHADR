import math
from typing import Tuple

def cubic_spline_kernel(r: float, h: float) -> float:
    """
    Computes 2D Cubic Spline SPH Smoothing Kernel W(r, h).
    
    W(r, h) = alpha * (1 - 1.5*q^2 + 0.75*q^3)  for 0 <= q <= 1
            = alpha * 0.25 * (2 - q)^3          for 1 < q <= 2
            = 0                                 for q > 2
            
    where alpha = 10 / (7 * pi * h^2), q = r / h.
    """
    q = r / h
    if q > 2.0:
        return 0.0

    alpha = 10.0 / (7.0 * math.pi * (h ** 2))
    if q <= 1.0:
        return alpha * (1.0 - 1.5 * (q ** 2) + 0.75 * (q ** 3))
    else:
        return alpha * 0.25 * ((2.0 - q) ** 3)

def cubic_spline_kernel_grad(dx: float, dy: float, r: float, h: float) -> Tuple[float, float]:
    """
    Computes gradient of 2D Cubic Spline SPH Kernel grad(W_ij).
    Returns (grad_x, grad_y).
    """
    if r < 1e-6 or r > 2.0 * h:
        return (0.0, 0.0)

    q = r / h
    alpha = 10.0 / (7.0 * math.pi * (h ** 2))
    
    if q <= 1.0:
        dWdr = (alpha / h) * (-3.0 * q + 2.25 * (q ** 2))
    else:
        dWdr = (alpha / h) * (-0.75 * ((2.0 - q) ** 2))

    grad_x = dWdr * (dx / r)
    grad_y = dWdr * (dy / r)
    return (grad_x, grad_y)
