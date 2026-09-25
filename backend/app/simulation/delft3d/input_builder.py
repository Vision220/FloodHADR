from typing import Dict, Any, List

class Delft3DInputBuilder:
    """
    Builds Delft3D time-varying boundary hydrograph files (.bct) and discharge point files (.src).
    """

    @staticmethod
    def generate_bct_file(breach_peak_q: float = 64200.0, duration_hr: float = 12.0) -> str:
        """
        Generates Delft3D-FLOW .bct time-varying inflow boundary condition deck.
        """
        bct_content = f"""table-name           'Boundary Section 1'
contents             'Time                Discharge'
location             'Tehri Dam Breach Outlet'
time-function        'non-equidistant'
reference-time       20260801
time-unit            'minutes'
interpolation        'linear'

0.0      150.0
30.0     12000.0
90.0     {breach_peak_q:.1f}
180.0    48000.0
360.0    25000.0
720.0    1800.0
"""
        return bct_content

    @staticmethod
    def generate_src_file(dam_x: float = 78.4802, dam_y: float = 30.3781) -> str:
        """Generates Delft3D-FLOW .src discharge location specification deck."""
        src_content = f"""table-name           'Spillway Outlet'
location-x          {dam_x:.4f}
location-y          {dam_y:.4f}
type                 'discharge'
salinity             0.0
temperature          18.5
"""
        return src_content
