from abc import ABC, abstractmethod
import datetime
import math
from typing import Dict, Any, List, Optional

class SensorProvider(ABC):
    """
    Abstract Base Class for Real-Time Telemetry & Sensor Data Providers.
    Establishes standardized interface across IoT Rain Gauges, River Stage Radar, Reservoir Telemetry, and Satellite Feeds.
    """

    @abstractmethod
    def get_provider_metadata(self) -> Dict[str, Any]:
        """
        Returns provider metadata: provider_id, name, status, notice.
        """
        pass

    @abstractmethod
    def get_live_readings(self) -> Dict[str, Any]:
        """
        Returns live real-time sensor observations.
        """
        pass

    @abstractmethod
    def get_time_series_data(self, duration_hr: int = 24) -> Dict[str, Any]:
        """
        Returns 24-hour historical time-series telemetry trends.
        """
        pass


class DemoSensorProvider(SensorProvider):
    """
    Synthetic Real-Time IoT Sensor Telemetry Provider.
    Generates realistic live telemetry streams for Tehri/Bhagirathi Basin.
    """

    def get_provider_metadata(self) -> Dict[str, Any]:
        return {
            "provider_id": "demo-iot-telemetry",
            "provider_name": "Tehri Basin IoT Telemetry & AWS Network",
            "source_type": "SYNTHETIC_TELEMETRY",
            "quality_status": "SIMULATED LIVE DATA",
            "notice": "SIMULATED LIVE DATA"
        }

    def get_live_readings(self) -> Dict[str, Any]:
        now_utc = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        # Live telemetry readings with slight high-frequency dynamic noise
        minute_sec = datetime.datetime.utcnow().minute + (datetime.datetime.utcnow().second / 60.0)
        noise_rain = round(12.5 + 2.5 * math.sin(minute_sec * 0.1), 1)
        noise_stage = round(8.42 + 0.15 * math.cos(minute_sec * 0.1), 2)
        noise_discharge = round(1450.0 + 85.0 * math.sin(minute_sec * 0.08), 1)
        noise_res_level = round(822.65 + 0.05 * math.sin(minute_sec * 0.05), 2)
        noise_velocity = round(4.85 + 0.12 * math.cos(minute_sec * 0.1), 2)

        return {
            "live_status": "ONLINE",
            "last_updated": now_utc,
            "data_notice": "SIMULATED LIVE DATA",
            "sensors": [
                {
                    "sensor_id": "aws-tehri-01",
                    "name": "Tehri IMD Automatic Weather Station",
                    "sensor_type": "AWS_RAIN_GAUGE",
                    "location": "Tehri Dam Site (km 40.0)",
                    "coordinates": {"lat": 30.378, "lng": 78.480},
                    "status": "ONLINE",
                    "battery_percent": 98.5,
                    "rainfall_intensity_mm_hr": noise_rain,
                    "rainfall_24h_cum_mm": 184.5,
                    "temperature_c": 18.4,
                    "humidity_percent": 92.0,
                    "unit": "mm/hr"
                },
                {
                    "sensor_id": "stage-uttarkashi-02",
                    "name": "Uttarkashi Bridge Radar Stage Gauge",
                    "sensor_type": "RADAR_RIVER_STAGE",
                    "location": "Uttarkashi Reach (km 95.0)",
                    "coordinates": {"lat": 30.726, "lng": 78.443},
                    "status": "ONLINE",
                    "battery_percent": 95.0,
                    "river_level_m": noise_stage,
                    "danger_level_m": 12.00,
                    "warning_level_m": 10.00,
                    "unit": "meters"
                },
                {
                    "sensor_id": "q-cwc-oldtehri-03",
                    "name": "CWC Old Tehri Confluence Discharge Gauge",
                    "sensor_type": "CWC_DISCHARGE_TELEMETER",
                    "location": "Old Tehri Confluence (km 42.5)",
                    "coordinates": {"lat": 30.380, "lng": 78.482},
                    "status": "ONLINE",
                    "battery_percent": 99.0,
                    "discharge_m3s": noise_discharge,
                    "baseline_discharge_m3s": 450.0,
                    "unit": "m3/s"
                },
                {
                    "sensor_id": "res-tehri-04",
                    "name": "Tehri Reservoir Ultrasonic Level Sensor",
                    "sensor_type": "RESERVOIR_ULTRASONIC",
                    "location": "Tehri Reservoir Pool",
                    "coordinates": {"lat": 30.382, "lng": 78.485},
                    "status": "ONLINE",
                    "battery_percent": 100.0,
                    "reservoir_level_m": noise_res_level,
                    "full_reservoir_level_m": 830.0,
                    "current_storage_mm3": 3215.4,
                    "unit": "meters"
                },
                {
                    "sensor_id": "vel-koti-05",
                    "name": "Koti Reach Doppler Radar Velocity Sensor",
                    "sensor_type": "DOPPLER_VELOCITY_RADAR",
                    "location": "Koti Reach (km 38.0)",
                    "coordinates": {"lat": 30.420, "lng": 78.480},
                    "status": "ONLINE",
                    "battery_percent": 94.0,
                    "velocity_ms": noise_velocity,
                    "unit": "m/s"
                },
                {
                    "sensor_id": "sat-sentinel1-06",
                    "name": "Sentinel-1 SAR Earth Observation Feed",
                    "sensor_type": "SATELLITE_SAR_EO",
                    "location": "Tehri River Reach (65 km)",
                    "coordinates": {"lat": 30.400, "lng": 78.500},
                    "status": "STREAMING",
                    "flooded_area_km2": 44.8,
                    "last_pass_time": "2026-09-24T18:30:00Z",
                    "unit": "km2"
                }
            ]
        }

    def get_time_series_data(self, duration_hr: int = 24) -> Dict[str, Any]:
        base_time = datetime.datetime.utcnow() - datetime.timedelta(hours=duration_hr)
        series = []

        for hr in range(duration_hr + 1):
            t_stamp = (base_time + datetime.timedelta(hours=hr)).strftime("%H:00")
            # Synthetic diurnal/monsoon hydrograph trend
            t_norm = hr / float(duration_hr)
            rain_trend = round(max(0.0, 45.0 * math.sin(t_norm * math.pi)), 1)
            stage_trend = round(4.5 + 6.2 * math.sin((t_norm - 0.2) * math.pi), 2) if t_norm >= 0.2 else 4.5
            discharge_trend = round(450.0 + 8500.0 * math.sin((t_norm - 0.25) * math.pi), 1) if t_norm >= 0.25 else 450.0
            res_trend = round(820.0 + 4.5 * t_norm, 2)
            vel_trend = round(1.8 + 4.2 * math.sin((t_norm - 0.2) * math.pi), 2) if t_norm >= 0.2 else 1.8

            series.append({
                "hour": hr,
                "timestamp": t_stamp,
                "rainfall_mm_hr": rain_trend,
                "river_level_m": max(1.0, stage_trend),
                "discharge_m3s": max(100.0, discharge_trend),
                "reservoir_level_m": res_trend,
                "velocity_ms": max(0.5, vel_trend)
            })

        return {
            "duration_hr": duration_hr,
            "data_notice": "SIMULATED LIVE DATA",
            "time_series": series
        }


class CWCSensorProvider(SensorProvider):
    """CWC Telemetry Provider (Fallback)."""
    def get_provider_metadata(self) -> Dict[str, Any]:
        return {
            "provider_id": "cwc-telemetry",
            "provider_name": "Central Water Commission Telemetry Gateway",
            "source_type": "OFFICIAL_TELEMETRY",
            "quality_status": "DISCONNECTED",
            "notice": "SIMULATED LIVE DATA"
        }

    def get_live_readings(self) -> Dict[str, Any]:
        fallback = DemoSensorProvider()
        res = fallback.get_live_readings()
        res["data_notice"] = "SIMULATED LIVE DATA"
        return res

    def get_time_series_data(self, duration_hr: int = 24) -> Dict[str, Any]:
        fallback = DemoSensorProvider()
        return fallback.get_time_series_data(duration_hr)
