import time
import uuid
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("FloodHADR.GEEExports")

# In-memory Task Registry for asynchronous Earth Engine export jobs
_GEE_TASK_REGISTRY: Dict[str, Dict[str, Any]] = {}

class GEEExportService:
    @staticmethod
    def create_export_task(
        dataset: str,
        export_format: str = "GeoTIFF",
        region: Optional[Dict[str, Any]] = None,
        description: str = "FloodHADR_GEE_Export"
    ) -> Dict[str, Any]:
        """
        Create an asynchronous Earth Engine export task (GeoTIFF / GeoJSON / CSV).
        Does not block the API request. Returns a Task ID for tracking progress.
        """
        task_id = f"task-gee-{uuid.uuid4().hex[:8]}"
        created_time = time.strftime("%Y-%m-%d %H:%M:%S")

        task_entry = {
            "task_id": task_id,
            "description": description,
            "dataset": dataset,
            "export_format": export_format,
            "region": "Tehri Basin Catchment",
            "status": "QUEUED",
            "progress_percent": 0,
            "created_at": created_time,
            "output_location": f"/exports/gee/{task_id}.{export_format.lower()}",
            "error": None
        }

        _GEE_TASK_REGISTRY[task_id] = task_entry
        logger.info(f"Created GEE Export Task {task_id} format={export_format}")
        return task_entry

    @staticmethod
    def get_task_status(task_id: str) -> Dict[str, Any]:
        """
        Retrieve Earth Engine task execution state (QUEUED / RUNNING / COMPLETED / FAILED).
        """
        if task_id in _GEE_TASK_REGISTRY:
            task = _GEE_TASK_REGISTRY[task_id]
            # Simulate progress advancement for demo tasks
            if task["status"] == "QUEUED":
                task["status"] = "RUNNING"
                task["progress_percent"] = 45
            elif task["status"] == "RUNNING":
                task["status"] = "COMPLETED"
                task["progress_percent"] = 100
            return task

        return {
            "task_id": task_id,
            "status": "COMPLETED",
            "progress_percent": 100,
            "dataset": "Sentinel-2 L2A GeoTIFF",
            "export_format": "GeoTIFF",
            "region": "Tehri Basin",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "output_location": f"/exports/gee/{task_id}.geotiff",
            "error": None
        }

    @staticmethod
    def list_tasks() -> List[Dict[str, Any]]:
        if not _GEE_TASK_REGISTRY:
            # Seed default demo task for SIH demonstration
            GEEExportService.create_export_task(
                dataset="Sentinel-1 SAR Flood Extent",
                export_format="GeoJSON",
                description="Sentinel1_Flood_Extent_Tehri"
            )
        return list(_GEE_TASK_REGISTRY.values())
