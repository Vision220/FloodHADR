import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { GISMapModule } from '../components/map/GISMapModule';
import { HydrographChart } from '../components/analytics/HydrographChart';
import { mockScenarios } from '../data/mockData';
import {
  MapPin,
  Flame,
  Waves,
  Maximize2,
  TrendingUp,
  Wind,
  Play,
  ArrowRight,
  ShieldAlert,
  Clock,
  Activity,
  Database,
  CheckCircle2,
  Gauge,
  Sparkles
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    selectedStudyArea,
    selectedDam,
    activeSimulation,
    setActivePage,
    startSimulation,
    currentTimeStep,
    setCurrentTimeStep,
    startDemoMode,
    isDemoLoading,
    isDemoMode,
    setShowFinalSummaryModal
  } = useApp();
  
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  // Playback timer effect for simulation timeline
  React.useEffect(() => {
    let timer: any;
    if (isPlayingTimeline) {
      timer = setInterval(() => {
        setCurrentTimeStep((currentTimeStep + 1) % 73);
      }, 300);
    }
    return () => clearInterval(timer);
  }, [isPlayingTimeline, currentTimeStep, setCurrentTimeStep]);

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-1">
      
      {/* DEMONSTRATION MODE HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-sky-700/50 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2 relative z-10 max-w-3xl">
          <div className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 fill-current text-slate-950" />
              INTERACTIVE DEMONSTRATION MODE
            </span>
            <span className="text-slate-300 text-xs font-mono font-bold">~5 Minutes Total Tour</span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Launch Guided 8-Step Flood Simulation Demonstration
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            Experience the complete FloodHADR workflow: <strong>Step 1</strong> Study Area → <strong>Step 2</strong> Dam & River → <strong>Step 3</strong> Configure Dam Break → <strong>Step 4</strong> Run Simulation → <strong>Step 5</strong> Flood Inundation → <strong>Step 6</strong> Impact Analysis → <strong>Step 7</strong> Compare Scenarios → <strong>Step 8</strong> Export Results & Summary!
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-sky-300">
            <span className="bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">Tehri River Basin</span>
            <span className="bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">Bhagirathi River</span>
            <span className="bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">260.5m Tehri Dam</span>
            <span className="bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">2D Diffusive Wave Solver</span>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-2 shrink-0">
          {isDemoMode ? (
            <button
              onClick={() => setShowFinalSummaryModal(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 text-xs font-black rounded-xl shadow-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-2 animate-pulse"
            >
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>[DEMO MODE ACTIVE] VIEW SUMMARY</span>
            </button>
          ) : (
            <button
              onClick={startDemoMode}
              disabled={isDemoLoading}
              id="btn-start-demo-mode-hero"
              className="px-7 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 text-xs font-black tracking-wider uppercase rounded-xl shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2.5 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 fill-current text-slate-950" />
              <span>[DEMO MODE] (5 MIN)</span>
            </button>
          )}
          <span className="text-[10px] text-slate-400 font-medium">Includes presentation narrator panel</span>
        </div>
      </div>

      {/* Dashboard Brand Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4 text-sky-600" />
            <span>HADR Decision Support Platform | Civil Engineering & Hydrology GIS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            FloodHADR
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-900 border border-sky-300">
              SIH 2026 (NTRO PS 26161)
            </span>
          </h1>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            Dam-Break & Flash-Flood Simulation Platform
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Active Study Area: <strong className="text-slate-800">{selectedStudyArea.name}</strong> | Dam: <strong className="text-slate-800">{selectedDam.name}</strong> ({selectedDam.river})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActivePage('scenario-comparison')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <span>Compare Scenarios</span>
          </button>
          <button
            onClick={startSimulation}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-900/20 transition-all flex items-center space-x-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Hydro Engine</span>
          </button>
        </div>
      </div>

      {/* 8 MANDATORY DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Study Area */}
        <StatCard
          title="Study Area"
          value={selectedStudyArea.name ? selectedStudyArea.name.split('(')[0] : 'Tehri Basin'}
          subtitle={`State: ${selectedStudyArea.state || 'Uttarakhand'} | Area: ${selectedStudyArea.areaKm2 || 1240} km²`}
          icon={MapPin}
          accentColor="blue"
          badge="ROI Bounds Loaded"
        />

        {/* Card 2: River */}
        <StatCard
          title="River"
          value={selectedDam.river ? selectedDam.river.split('/')[0] : 'Bhagirathi'}
          subtitle={`Ganga Basin Reach | Slope: 0.008 m/m`}
          icon={Waves}
          accentColor="teal"
          badge="Main Channel"
        />

        {/* Card 3: Dam */}
        <StatCard
          title="Dam"
          value={selectedDam.name ? selectedDam.name.split(' ')[0] + ' Dam' : 'Tehri Dam'}
          subtitle={`Height: ${selectedDam.heightM}m | Storage: ${selectedDam.reservoirVolumeMm3}M m³`}
          icon={Flame}
          accentColor="navy"
          badge={selectedDam.damType || 'Rockfill'}
        />

        {/* Card 4: Simulation Status */}
        <StatCard
          title="Simulation Status"
          value={activeSimulation.status}
          subtitle={`2D Diffusive Wave Solver | Exec Time: ${activeSimulation.executionTimeSec}s`}
          icon={CheckCircle2}
          accentColor="emerald"
          badge="100% Completed"
        />

        {/* Card 5: Flood Area */}
        <StatCard
          title="Flood Area"
          value={activeSimulation.maxFloodAreaKm2}
          unit="km²"
          subtitle="Peak Hydrodynamic Inundation Footprint"
          icon={Maximize2}
          accentColor="amber"
          badge="Envelope Polygon"
        />

        {/* Card 6: Maximum Depth */}
        <StatCard
          title="Maximum Depth"
          value={activeSimulation.maxDepthM}
          unit="m"
          subtitle="Peak Flow Depth at Dam Outlet Corridor"
          icon={TrendingUp}
          accentColor="red"
          badge="Critical Submergence"
        />

        {/* Card 7: Maximum Velocity */}
        <StatCard
          title="Maximum Velocity"
          value={activeSimulation.maxVelocityMs}
          unit="m/s"
          subtitle="Dam-Break Wave Front Wave Speed"
          icon={Wind}
          accentColor="teal"
          badge="Supercritical Flow"
        />

        {/* Card 8: Critical Assets Affected */}
        <StatCard
          title="Critical Assets Affected"
          value="12"
          unit="assets"
          subtitle="2 Hospitals, 2 Substation, 4 Bridges, 4 Shelters"
          icon={ShieldAlert}
          accentColor="red"
          badge="HADR Action Req."
        />
      </div>

      {/* CENTRAL GIS MAP & SIMULATION TIMELINE CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Large GIS Map Area */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>Integrated GIS Inundation Command Map</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time 2D hydrodynamic flood wave propagation overlay on 50m DEM terrain
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActivePage('flood-map')}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg border border-sky-200 transition-all flex items-center space-x-1"
                >
                  <span>Full-Screen GIS Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Large Interactive Map Canvas */}
            <div className="h-[520px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <GISMapModule height="100%" showControls={true} />
            </div>

            {/* Simulation Timeline Widget */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold transition-all"
                  >
                    {isPlayingTimeline ? 'Pause' : 'Play Timeline'}
                  </button>
                  <span className="text-slate-300">Wave Front Progression:</span>
                  <span className="text-sky-400 font-bold">
                    t = {((currentTimeStep * 600) / 3600).toFixed(1)} Hours (Step {currentTimeStep}/72)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400">Peak Outflow Q: 48,500 m³/s</span>
              </div>

              <input
                type="range"
                min="0"
                max="72"
                value={currentTimeStep}
                onChange={(e) => {
                  setIsPlayingTimeline(false);
                  setCurrentTimeStep(parseInt(e.target.value));
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>

          {/* Hydrograph Chart Component */}
          <HydrographChart />
        </div>

        {/* RIGHT SIDEBAR: RECENT SCENARIOS, SYSTEM STATUS & DATA QUALITY */}
        <div className="space-y-6">
          {/* Recent Scenarios Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Recent Breach Scenarios</span>
              </h3>
              <button
                onClick={() => setActivePage('dam-break')}
                className="text-[11px] text-sky-700 hover:text-sky-900 font-bold"
              >
                + New Scenario
              </button>
            </div>

            <div className="space-y-2.5">
              {mockScenarios.slice(0, 3).map((scen) => (
                <div
                  key={scen.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-sky-300 transition-all space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[170px]">{scen.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                      {scen.failureMode}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 text-[11px] text-slate-500 font-mono">
                    <div>Peak Q: {scen.peakDischargeM3s.toLocaleString()} m³/s</div>
                    <div>Formation: {scen.formationTimeHr} hrs</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-3">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>System & Compute Health</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Hydro Core Solver:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE (2D Diffusive)
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">PostGIS Spatial Database:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" /> CONNECTED (EPSG:4326)
                </span>
              </div>

              <div className="flex justify-between items-center py-1 text-slate-600">
                <span>API Latency:</span>
                <span className="font-mono font-bold text-sky-700">14ms</span>
              </div>
            </div>
          </div>

          {/* Data Quality Indicators Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-3">
              <Gauge className="w-4 h-4 text-indigo-600" />
              <span>Data Quality Indicators</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                <div className="text-[10px] font-bold text-slate-500 uppercase">DEM Grid Resolution</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">50m ALOS PALSAR</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">High-Precision Elevation Matrix</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Manning's N Roughness Score</div>
                <div className="text-sm font-bold text-teal-700 mt-0.5">98.4% Quality Rating</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Calibrated Channel (0.035) & Plain (0.045)</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                <div className="text-[10px] font-bold text-slate-500 uppercase">CFL Stability Criterion</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5 font-mono">CFL = 0.42 (SAFE)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Courant-Friedrichs-Lewy convergence safe</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
