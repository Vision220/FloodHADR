from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class SatelliteProvider(ABC):
    """
    Abstract Service Interface for Satellite Flood Extraction Providers.
    Supports pluggable implementations: DemoProvider (Local Sample Data) and
    GoogleEarthEngineProvider (Future GEE API Integration).
    """

    @abstractmethod
    def acquire_satellite_data(
        self,
        study_area_id: str,
        satellite_source: str,
        before_date: str,
        after_date: str
    ) -> Dict[str, Any]:
        """
        Stage 1: Acquisition
        Acquires pre-event baseline and post-event satellite imagery collections.
        """
        pass

    @abstractmethod
    def preprocess_imagery(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Stage 2: Preprocessing
        Applies speckle filtering (Refined Lee / Frost), terrain correction, and radiometric calibration.
        """
        pass

    @abstractmethod
    def detect_water_extent(self, preprocessed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Stage 3: Water Detection
        Extracts water surfaces using backscatter thresholding (SAR VV/VH) or spectral indices (NDWI / MNDWI).
        """
        pass

    @abstractmethod
    def extract_flood_extent(self, water_mask: Dict[str, Any]) -> Dict[str, Any]:
        """
        Stage 4: Flood Extent
        Subtracts permanent reference water bodies to isolate temporary flood inundation footprint.
        """
        pass

    @abstractmethod
    def compare_with_model(
        self,
        satellite_extent: Dict[str, Any],
        model_extent: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Stage 5: Model Comparison
        Computes spatial agreement, model over-prediction, under-prediction, and Critical Success Index (CSI).
        """
        pass
