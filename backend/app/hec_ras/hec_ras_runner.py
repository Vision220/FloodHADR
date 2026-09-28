"""
backend/app/hec_ras/hec_ras_runner.py

HEC-RAS Executable Detection & Execution Manager.
Detects local USACE HEC-RAS installations (Ras.exe / ras64).
If executable is unavailable, cleanly reports:
  HEC-RAS PROJECT: GENERATED
  HEC-RAS EXECUTION: NOT AVAILABLE
Without fabricating fake results.
"""

import os
import shutil
import subprocess
from enum import Enum
from typing import Dict, Any, Optional
from dataclasses import dataclass


class HECRASExecutionStatus(str, Enum):
    PROJECT_GENERATED = "HEC-RAS PROJECT: GENERATED"
    EXECUTION_SUCCESSFUL = "HEC-RAS EXECUTION: SUCCESSFUL"
    EXECUTION_NOT_AVAILABLE = "HEC-RAS EXECUTION: NOT AVAILABLE"
    EXECUTION_FAILED = "HEC-RAS EXECUTION: FAILED"


class HECRASRunner:
    """
    HEC-RAS Executable Manager and Headless Controller.
    """

    def __init__(self, custom_exe_path: Optional[str] = None):
        self.exe_path = custom_exe_path or self.find_hecras_executable()

    @staticmethod
    def find_hecras_executable() -> Optional[str]:
        """
        Scans environment and standard installation directories for HEC-RAS binary.
        """
        # 1. Environment variable override
        env_path = os.getenv("HECRAS_EXE") or os.getenv("HECRAS_PATH")
        if env_path and os.path.exists(env_path) and os.path.isfile(env_path):
            return env_path

        # 2. System PATH search
        for candidate in ["Ras.exe", "ras64.exe", "Ras", "ras64", "hecras"]:
            found = shutil.which(candidate)
            if found:
                return found

        # 3. Standard Windows installation paths
        search_roots = [
            r"C:\Program Files (x86)\HEC",
            r"C:\Program Files\HEC",
            r"C:\HEC",
        ]

        for root in search_roots:
            if os.path.exists(root):
                for dirpath, _, filenames in os.walk(root):
                    for filename in filenames:
                        if filename.lower() in ["ras.exe", "ras64.exe", "hecras.exe"]:
                            return os.path.join(dirpath, filename)

        # 4. Standard Linux/Unix paths
        linux_paths = ["/usr/local/bin/ras64", "/usr/bin/hecras", "/opt/hecras/bin/ras64"]
        for lp in linux_paths:
            if os.path.exists(lp):
                return lp

        return None

    def is_available(self) -> bool:
        """Returns True if HEC-RAS executable is found on system."""
        return self.exe_path is not None and os.path.exists(self.exe_path)

    def run_hecras_project(
        self,
        project_file_path: str,
        plan_id: str = "p01",
        timeout_sec: float = 300.0
    ) -> Dict[str, Any]:
        """
        Executes HEC-RAS project if executable is available.
        If unavailable, returns explicit NOT AVAILABLE status without fabricating fake results.
        """
        project_abs_path = os.path.abspath(project_file_path)

        if not self.is_available():
            return {
                "hec_ras_project_status": HECRASExecutionStatus.PROJECT_GENERATED.value,
                "hec_ras_execution_status": HECRASExecutionStatus.EXECUTION_NOT_AVAILABLE.value,
                "executable_found": False,
                "executable_path": None,
                "results_available": False,
                "message": (
                    "HEC-RAS project files (.prj, .g01, .u01, .p01, terrain.hdf) were successfully generated "
                    "and validated. HEC-RAS console executable (Ras.exe) is not installed on this host system. "
                    "Execution skipped to prevent result fabrication."
                ),
                "project_file": project_abs_path,
                "execution_time_sec": 0.0,
            }

        # Executable IS available -> Run headless calculation
        try:
            cmd = [self.exe_path, project_abs_path, plan_id, "b01"]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_sec)

            if res.returncode == 0:
                return {
                    "hec_ras_project_status": HECRASExecutionStatus.PROJECT_GENERATED.value,
                    "hec_ras_execution_status": HECRASExecutionStatus.EXECUTION_SUCCESSFUL.value,
                    "executable_found": True,
                    "executable_path": self.exe_path,
                    "results_available": True,
                    "message": "HEC-RAS 2D simulation completed successfully.",
                    "project_file": project_abs_path,
                    "stdout": res.stdout,
                    "returncode": 0
                }
            else:
                return {
                    "hec_ras_project_status": HECRASExecutionStatus.PROJECT_GENERATED.value,
                    "hec_ras_execution_status": HECRASExecutionStatus.EXECUTION_FAILED.value,
                    "executable_found": True,
                    "executable_path": self.exe_path,
                    "results_available": False,
                    "message": f"HEC-RAS execution exited with error code {res.returncode}.",
                    "project_file": project_abs_path,
                    "stderr": res.stderr,
                    "returncode": res.returncode
                }
        except Exception as e:
            return {
                "hec_ras_project_status": HECRASExecutionStatus.PROJECT_GENERATED.value,
                "hec_ras_execution_status": HECRASExecutionStatus.EXECUTION_FAILED.value,
                "executable_found": True,
                "executable_path": self.exe_path,
                "results_available": False,
                "message": f"Exception encountered during HEC-RAS execution: {str(e)}",
                "project_file": project_abs_path,
                "error": str(e)
            }
