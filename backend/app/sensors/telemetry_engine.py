import datetime
import math
from typing import Dict, Any, List, Optional
from app.sensors.sensor_provider import DemoSensorProvider, CWCSensorProvider
from app.simulation.hydrodynamic_engine import HydrodynamicEngine

class TelemetryEngine:
    """
    Real-Time Telemetry & Sensor Integration Engine.
    Coordinates live sensor polling, timestamped observation logging, and direct coupling to Hydrodynamic Engine.
    """

    def __init__(self):
        self.provider = DemoSensorProvider()
        self.hydro_engine = HydrodynamicEngine()

    def get_live_status_and_readings(self) -> Dict[str, Any]:
        """Fetches live sensor readings, telemetry status, and notice."""
        return self.provider.get_live_readings()

    def get_historical_time_series(self, duration_hr: int = 24) -> Dict[str, Any]:
        """Fetches time-series telemetry trends."""
        return self.provider.get_time_series_data(duration_hr)

    def feed_live_telemetry_to_scenario(self, scenario_envelope: str = "EXTREME") -> Dict[str, Any]:
        """
        Connects real-time sensor observations directly to hydrodynamic scenario calculations.
        Extracts live Q, live rainfall, live reservoir level, and propagates 2D flood wave.
        """
        readings = self.provider.get_live_readings()
        sensors = readings["sensors"]

        # Extract live values from active sensors
        rain_sensor = next((s for s in sensors if s["sensor_type"] == "AWS_RAIN_GAUGE"), sensors[0])
        res_sensor = next((s for s in sensors if s["sensor_type"] == "RESERVOIR_ULTRASONIC"), sensors[3])
        q_sensor = next((s for s in sensors if s["sensor_type"] == "CWC_DISCHARGE_TELEMETER"), sensors[2])

        live_rain_mm = rain_sensor.get("rainfall_24h_cum_mm", 184.5)
        live_res_m = res_sensor.get("reservoir_level_m", 822.65)
        live_q_m3s = q_sensor.get("discharge_m3s", 1450.0)

        # Run hydrodynamic scenario engine driven by live telemetry
        sim_res = self.hydro_engine.run_simulation(
            scenario_envelope=scenario_envelope,
            custom_rainfall_mm=live_rain_mm,
            custom_reservoir_level_m=live_res_m,
            include_tributaries=True
        )

        return {
            "status": "SUCCESS",
            "telemetry_source": readings["provider_id"] if "provider_id" in readings else "demo-iot-telemetry",
            "last_updated": readings["last_updated"],
            "live_input_observations": {
                "live_rainfall_mm": live_rain_mm,
                "live_reservoir_level_m": live_res_m,
                "live_observed_discharge_m3s": live_q_m3s
            },
            "hydrodynamic_simulation_results": sim_res,
            "data_notice": "SIMULATED LIVE DATA"
        }
