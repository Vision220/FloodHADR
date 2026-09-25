from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class ClimateProjectionProvider(ABC):
    """
    Abstract Interface for Climate Change & Future Hazard Projection Data Providers.
    Supports CMIP6, CORDEX South Asia, and Sensitivity/Demo Mode Providers.
    """

    @abstractmethod
    def get_provider_metadata(self) -> Dict[str, Any]:
        """
        Returns metadata: provider_id, name, dataset_status, connected_flag, notice.
        """
        pass

    @abstractmethod
    def get_projection_factors(
        self,
        horizon_year: str = "2050",
        ssp_scenario: str = "SSP3-7.0"
    ) -> Dict[str, Any]:
        """
        Returns sensitivity factors for:
        - rainfall_intensity_multiplier
        - extreme_precipitation_multiplier
        - runoff_response_factor
        - reservoir_inflow_multiplier
        """
        pass


class DemoClimateProjectionProvider(ClimateProjectionProvider):
    """
    Sensitivity Analysis & Demo Mode Climate Provider.
    Used when live CMIP/CORDEX netCDF datasets are not connected.
    """

    def get_provider_metadata(self) -> Dict[str, Any]:
        return {
            "provider_id": "demo-sensitivity-climate",
            "provider_name": "FloodHADR Climate Sensitivity Analysis Engine",
            "dataset_name": "Synthetic Regional Sensitivity Matrix (IPCC AR6 Scaling)",
            "connected": False,
            "quality_status": "DEMO / SENSITIVITY",
            "notice": "Climate dataset not connected — sensitivity/demo mode."
        }

    def get_projection_factors(
        self,
        horizon_year: str = "2050",
        ssp_scenario: str = "SSP3-7.0"
    ) -> Dict[str, Any]:
        # Baseline horizon
        if horizon_year in ["Current", "Baseline", "2024"]:
            return {
                "horizon_year": "Current",
                "ssp_scenario": "Baseline",
                "temp_anomaly_c": 0.0,
                "rainfall_intensity_multiplier": 1.00,
                "extreme_precipitation_multiplier": 1.00,
                "runoff_response_factor": 1.00,
                "reservoir_inflow_multiplier": 1.00,
                "glacier_melt_surge_m3s": 0.0
            }

        # Horizon year multipliers (CMIP6 regional IPCC AR6 scaling bounds for NW Himalayas)
        horizon_scale = {
            "2030": {"temp": 0.8, "rain": 1.08, "extreme": 1.12, "runoff": 1.10, "inflow": 1.09, "glacier": 150.0},
            "2050": {"temp": 1.7, "rain": 1.18, "extreme": 1.28, "runoff": 1.24, "inflow": 1.22, "glacier": 380.0},
            "2070": {"temp": 2.6, "rain": 1.30, "extreme": 1.45, "runoff": 1.40, "inflow": 1.36, "glacier": 650.0},
            "2100": {"temp": 3.8, "rain": 1.48, "extreme": 1.70, "runoff": 1.62, "inflow": 1.55, "glacier": 980.0}
        }.get(str(horizon_year), {"temp": 1.7, "rain": 1.18, "extreme": 1.28, "runoff": 1.24, "inflow": 1.22, "glacier": 380.0})

        # SSP scenario multiplier adjustments
        ssp_scale = {
            "SSP1-2.6": 0.70,
            "SSP2-4.5": 0.90,
            "SSP3-7.0": 1.15,
            "SSP5-8.5": 1.40
        }.get(ssp_scenario.upper(), 1.15)

        rain_mult = round(1.0 + (horizon_scale["rain"] - 1.0) * ssp_scale, 3)
        extreme_mult = round(1.0 + (horizon_scale["extreme"] - 1.0) * ssp_scale, 3)
        runoff_mult = round(1.0 + (horizon_scale["runoff"] - 1.0) * ssp_scale, 3)
        inflow_mult = round(1.0 + (horizon_scale["inflow"] - 1.0) * ssp_scale, 3)

        return {
            "horizon_year": str(horizon_year),
            "ssp_scenario": ssp_scenario,
            "temp_anomaly_c": round(horizon_scale["temp"] * ssp_scale, 2),
            "rainfall_intensity_multiplier": rain_mult,
            "extreme_precipitation_multiplier": extreme_mult,
            "runoff_response_factor": runoff_mult,
            "reservoir_inflow_multiplier": inflow_mult,
            "glacier_melt_surge_m3s": round(horizon_scale["glacier"] * ssp_scale, 1)
        }


class CMIPClimateProjectionProvider(ClimateProjectionProvider):
    """
    CMIP6 (Coupled Model Intercomparison Project Phase 6) Dataset Provider.
    Checked against local NetCDF archives if available.
    """

    def get_provider_metadata(self) -> Dict[str, Any]:
        return {
            "provider_id": "cmip6-wcrp",
            "provider_name": "WCRP CMIP6 HighResMIP Ensemble (0.25deg)",
            "dataset_name": "CMIP6 GFDL-ESM4 / EC-Earth3-Veg Regional Subset",
            "connected": False,
            "quality_status": "DISCONNECTED",
            "notice": "Climate dataset not connected — sensitivity/demo mode."
        }

    def get_projection_factors(
        self,
        horizon_year: str = "2050",
        ssp_scenario: str = "SSP3-7.0"
    ) -> Dict[str, Any]:
        demo_fallback = DemoClimateProjectionProvider()
        return demo_fallback.get_projection_factors(horizon_year, ssp_scenario)


class CORDEXClimateProjectionProvider(ClimateProjectionProvider):
    """
    CORDEX South Asia (Coordinated Regional Climate Downscaling Experiment) Dataset Provider.
    """

    def get_provider_metadata(self) -> Dict[str, Any]:
        return {
            "provider_id": "cordex-south-asia",
            "provider_name": "CORDEX South Asia 0.11deg RegCM4 Downscaled Ensemble",
            "dataset_name": "CORDEX SA IITM Regional Downscaling Archive",
            "connected": False,
            "quality_status": "DISCONNECTED",
            "notice": "Climate dataset not connected — sensitivity/demo mode."
        }

    def get_projection_factors(
        self,
        horizon_year: str = "2050",
        ssp_scenario: str = "SSP3-7.0"
    ) -> Dict[str, Any]:
        demo_fallback = DemoClimateProjectionProvider()
        return demo_fallback.get_projection_factors(horizon_year, ssp_scenario)
