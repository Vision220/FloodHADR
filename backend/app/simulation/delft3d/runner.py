import os
import shutil
from typing import Dict, Any, Optional

UNCONFIGURED_MESSAGE = "Delft3D engine not configured."

class Delft3DRunner:
    """
    Delft3D Process Launcher & Environment Detector.
    Detects external executable environment (DELFT3D_HOME / DELFT3D_EXEC) and manages process execution.
    """

    @staticmethod
    def is_delft3d_available() -> bool:
        """
        Detects whether the external Delft3D executable environment is available.
        Checks DELFT3D_HOME, DELFT3D_EXEC environment variables, or system PATH.
        """
        delft_home = os.environ.get("DELFT3D_HOME")
        delft_exec = os.environ.get("DELFT3D_EXEC")
        if delft_home and os.path.exists(delft_home):
            return True
        if delft_exec and os.path.exists(delft_exec):
            return True
        # Check system PATH for binary
        if shutil.which("delft3d_flow") or shutil.which("d_waterflow"):
            return True
        return False

    @classmethod
    def check_engine_status(cls) -> Dict[str, Any]:
        """
        Returns dynamic engine availability and configuration status.
        Does NOT throw exceptions if engine binary is missing.
        """
        available = cls.is_delft3d_available()
        if available:
            return {
                "engine": "Delft3D-FLOW External HPC Engine",
                "is_available": True,
                "status": "READY",
                "message": "Delft3D executable environment detected and ready for HPC execution."
            }
        else:
            return {
                "engine": "Delft3D-FLOW External HPC Engine",
                "is_available": False,
                "status": "UNAVAILABLE",
                "message": UNCONFIGURED_MESSAGE,
                "detail": "Set DELFT3D_HOME or DELFT3D_EXEC environment path to enable live external HPC execution."
            }
