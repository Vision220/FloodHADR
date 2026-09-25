import logging
from typing import Dict, Any, Optional
from app.services.gee import (
    GEEAuth,
    GEEClient,
    GEEImageryService,
    GEERainfallService,
    GEEFloodService,
    GEELandcoverService,
    GEEWaterService,
    GEEChangeDetectionService,
    GEEExportService
)

logger = logging.getLogger("FloodHADR.GEEService")

class GEEMasterService:
    def __init__(self):
        self.client = GEEClient()
        self.imagery = GEEImageryService(self.client)
        self.rainfall = GEERainfallService(self.client)
        self.flood = GEEFloodService(self.client)
        self.landcover = GEELandcoverService(self.client)
        self.water = GEEWaterService(self.client)
        self.change_detection = GEEChangeDetectionService(self.client)
        self.exports = GEEExportService()

    def get_status(self) -> Dict[str, Any]:
        return GEEAuth.get_status()

# Singleton master GEE service instance
gee_master_service = GEEMasterService()
