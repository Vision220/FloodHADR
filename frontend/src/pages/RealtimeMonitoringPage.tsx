import React, { useState, useEffect } from 'react';
import {
  Radio,
  Activity,
  CloudRain,
  Droplets,
  Wind,
  ShieldAlert,
  RefreshCw,
  PlayCircle,
  Clock,
  Layers,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface SensorItem {
  sensor_id: string;
  name: string;
  sensor_type: string;
  location: string;
  coordinates: { lat: number; lng: number };
  status: string;
  battery_percent: number;
  rainfall_intensity_mm_hr?: number;
  rainfall_24h_cum_mm?: number;
  river_level_m?: number;
  discharge_m3s?: number;
  reservoir_level_m?: number;
  velocity_ms?: number;
  flooded_area_km2?: number;
  unit: string;
}

interface LiveReadingsResponse {
  live_status: string;
  last_updated: string;
  data_notice: string;
  sensors: SensorItem[];
}

interface TimeSeriesPoint {
  hour: number;
  timestamp: string;
  rainfall_mm_hr: number;
  river_level_m: number;
  discharge_m3s: number;
  reservoir_level_m: number;
  velocity_ms: number;
}

interface LiveScenarioResponse {
  status: string;
  telemetry_source: string;
  last_updated: string;
  live_input_observations: {
    live_rainfall_mm: number;
    live_reservoir_level_m: number;
    live_observed_discharge_m3s: number;
  };
  hydrodynamic_simulation_results: {
    hydrodynamic_outputs: {
      combined_peak_discharge_m3s: number;
      max_water_depth_m: number;
      max_velocity_ms: number;
      flood_inundation_area_km2: number;
      peak_arrival_time_min: number;
      flood_duration_hr: number;
    };
  };
  data_notice: string;
}

export const RealtimeMonitoringPage: React.FC = () => {
  const [liveData, setLiveData] = useState<LiveReadingsResponse | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [liveScenarioResult, setLiveScenarioResult] = useState<LiveScenarioResponse | null>(null);

  useEffect(() => {
    fetchLiveReadings();
    fetchTimeSeries();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLiveReadings();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchLiveReadings = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/sensors/live-status');
      if (res.ok) {
        const data: LiveReadingsResponse = await res.json();
        setLiveData(data);
      }
    } catch (err) {
      console.error('Failed to fetch live sensor readings:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchTimeSeries = async () => {
    try {
      const res = await fetch('/api/sensors/time-series?duration_hr=24');
      if (res.ok) {
        const data = await res.json();
        setTimeSeries(data.time_series);
      }
    } catch (err) {
      console.error('Failed to fetch time series:', err);
    }
  };

  const feedTelemetryToScenario = async () => {
    try {
      const res = await fetch('/api/sensors/feed-to-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_envelope: 'EXTREME' })
      });
      if (res.ok) {
        const data: LiveScenarioResponse = await res.json();
        setLiveScenarioResult(data);
      }
    } catch (err) {
      console.error('Failed to feed live telemetry to scenario:', err);
    }
  };

  const getSensorValue = (type: string) => {
    if (!liveData) return '...';
    const s = liveData.sensors.find((x) => x.sensor_type === type);
    if (!s) return '...';
    if (s.rainfall_intensity_mm_hr !== undefined) return `${s.rainfall_intensity_mm_hr} mm/hr`;
    if (s.river_level_m !== undefined) return `${s.river_level_m} m`;
    if (s.discharge_m3s !== undefined) return `${s.discharge_m3s.toLocaleString()} m³/s`;
    if (s.reservoir_level_m !== undefined) return `${s.reservoir_level_m} m`;
    if (s.velocity_ms !== undefined) return `${s.velocity_ms} m/s`;
    if (s.flooded_area_km2 !== undefined) return `${s.flooded_area_km2} km²`;
    return '...';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Real-Time Telemetry & Flood Intelligence
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE TELEMETRY STREAMING
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                IoT Weather AWS, River Stage Radar, Doppler Velocity, Reservoir Telemetry, and Sentinel-1 SAR Feeds
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Controls & Mandatory SIMULATED LIVE DATA Notice */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2 flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="text-xs font-bold text-amber-300">
              {liveData?.data_notice || 'SIMULATED LIVE DATA'}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                autoRefresh ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Auto-Polling {autoRefresh ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={fetchLiveReadings}
              disabled={refreshing}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
              title="Manual Poll Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Live Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Rainfall AWS */}
        <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-cyan-400" /> Rain Gauge AWS
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
          </div>
          <div className="text-xl font-black text-cyan-400 mt-2 font-mono">
            {getSensorValue('AWS_RAIN_GAUGE')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">24h Cum: 184.5 mm</div>
        </div>

        {/* River Level Stage */}
        <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-4">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-400" /> River Stage
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
          </div>
          <div className="text-xl font-black text-blue-400 mt-2 font-mono">
            {getSensorValue('RADAR_RIVER_STAGE')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Danger Lvl: 12.0 m</div>
        </div>

        {/* Discharge */}
        <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-4">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-400" /> Discharge Q
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
          </div>
          <div className="text-xl font-black text-rose-400 mt-2 font-mono">
            {getSensorValue('CWC_DISCHARGE_TELEMETER')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">CWC Telemetry</div>
        </div>

        {/* Reservoir Level */}
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-amber-400" /> Reservoir Level
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
          </div>
          <div className="text-xl font-black text-amber-400 mt-2 font-mono">
            {getSensorValue('RESERVOIR_ULTRASONIC')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">FRL: 830.0 m</div>
        </div>

        {/* Doppler Velocity */}
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-emerald-400" /> Flow Velocity
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
          </div>
          <div className="text-xl font-black text-emerald-400 mt-2 font-mono">
            {getSensorValue('DOPPLER_VELOCITY_RADAR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Koti Reach</div>
        </div>

        {/* Satellite EO Feed */}
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-4">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" /> Sentinel-1 SAR
            </span>
            <span className="text-[10px] text-purple-300 font-mono">EO FEED</span>
          </div>
          <div className="text-xl font-black text-purple-400 mt-2 font-mono">
            {getSensorValue('SATELLITE_SAR_EO')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Inundation extent</div>
        </div>
      </div>

      {/* Feed Telemetry to Scenario Action Banner */}
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-bold text-white">Direct Live Telemetry Scenario Coupling</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Feed live IoT gauge observations (Q_obs, P_obs, Reservoir Water Level) directly into the 2D hydrodynamic scenario solver.
            </div>
          </div>
        </div>

        <button
          onClick={feedTelemetryToScenario}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-emerald-950 flex items-center gap-2 flex-shrink-0"
        >
          <PlayCircle className="w-4 h-4" />
          Feed Telemetry into Hydrodynamic Scenario Engine
        </button>
      </div>

      {/* Live Scenario Coupling Results Panel */}
      {liveScenarioResult && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Live Telemetry-Driven 2D Hydrodynamic Scenario Output
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Last updated: {liveScenarioResult.last_updated}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-sans">Combined Hydrodynamic Discharge</div>
              <div className="text-lg font-black text-rose-400 mt-1">
                {liveScenarioResult.hydrodynamic_simulation_results.hydrodynamic_outputs.combined_peak_discharge_m3s.toLocaleString()} m³/s
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-sans">Max Flood Depth / Wave Speed</div>
              <div className="text-lg font-black text-cyan-400 mt-1">
                {liveScenarioResult.hydrodynamic_simulation_results.hydrodynamic_outputs.max_water_depth_m} m ({liveScenarioResult.hydrodynamic_simulation_results.hydrodynamic_outputs.max_velocity_ms} m/s)
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-sans">Live Flooded Surface Area</div>
              <div className="text-lg font-black text-purple-400 mt-1">
                {liveScenarioResult.hydrodynamic_simulation_results.hydrodynamic_outputs.flood_inundation_area_km2} km²
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 24-Hour Telemetry Time-Series Chart Box & Live Sensors Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time-Series Trend Chart Box */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            24-Hour Telemetry Time-Series Trends
          </h3>

          <div className="space-y-3">
            {timeSeries.slice(-8).map((pt, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-semibold">{pt.timestamp}</span>
                <span className="text-cyan-400">Rain: {pt.rainfall_mm_hr} mm/h</span>
                <span className="text-blue-400">Stage: {pt.river_level_m} m</span>
                <span className="text-rose-400">Q: {pt.discharge_m3s.toLocaleString()} m³/s</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Sensor Inventory Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Active IoT Telemetry Station Inventory
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                  <th className="p-2.5">Station Name</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5">Battery</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {liveData?.sensors.map((s) => (
                  <tr key={s.sensor_id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-medium text-white">{s.name}</td>
                    <td className="p-2.5 text-slate-400">{s.location}</td>
                    <td className="p-2.5 font-mono text-emerald-400">{s.battery_percent}%</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
