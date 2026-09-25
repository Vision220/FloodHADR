import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockScenarios, mockSimulations } from '../data/mockData';
import type { BreachScenario, SimulationRun } from '../types';
import { GISMapModule } from '../components/map/GISMapModule';
import {
  GitCompare,
  ExternalLink,
  Info,
  Map,
  Activity,
  Gauge,
  Clock,
  Building2,
  Navigation,
  ShieldAlert,
  Sliders,
  Database
} from 'lucide-react';

export const ScenarioComparisonPage: React.FC = () => {
  const { setSelectedScenario, setActiveSimulation, setActivePage } = useApp();

  // Tab state: 'SCENARIOS' vs 'GRID_VS_SPH'
  const [comparisonTab, setComparisonTab] = useState<'SCENARIOS' | 'GRID_VS_SPH'>('SCENARIOS');

  // Selected Scenarios State (Up to 3 scenarios)
  const [selectedScenarios, setSelectedScenarios] = useState<BreachScenario[]>([
    mockScenarios[0],
    mockScenarios[1],
    mockScenarios[3] || mockScenarios[2],
  ]);

  const [enableThirdSlot] = useState<boolean>(true);

  // Derive active scenarios list (2 or 3)
  const activeScenarios = enableThirdSlot
    ? selectedScenarios.slice(0, 3)
    : selectedScenarios.slice(0, 2);

  // Helper function to find associated simulation run
  const getSim = (scen: BreachScenario): SimulationRun => {
    return (
      mockSimulations.find((s) => s.scenarioId === scen.id) || {
        id: `sim-${scen.id}`,
        scenarioId: scen.id,
        scenarioTitle: scen.title,
        damName: 'Tehri Dam',
        studyAreaName: 'Tehri River Basin',
        status: 'Completed',
        progressPercent: 100,
        executionTimeSec: 35.0,
        maxFloodAreaKm2: Math.round(scen.breachWidthM * 1.5 * 10) / 10,
        maxDepthM: Math.round((scen.breachHeightM || 100) * 0.12 * 10) / 10,
        maxVelocityMs: Math.round((scen.breachWidthM / 20) * 10) / 10,
        affectedPopulation: Math.round(scen.breachWidthM * 750),
        timeStepsTotal: 72,
        currentTimeStepSec: 21600,
        timestamp: scen.createdDate,
        peakFlowTimeHr: scen.formationTimeHr + 0.5,
      }
    );
  };

  // Handler to open a specific scenario individually
  const handleOpenScenario = (scen: BreachScenario) => {
    setSelectedScenario(scen);
    setActiveSimulation(getSim(scen));
    setActivePage('flood-map');
  };

  // Scenario picker change handler
  const handleSelectScenario = (index: number, scenarioId: string) => {
    const found = mockScenarios.find((s) => s.id === scenarioId);
    if (found) {
      const updated = [...selectedScenarios];
      updated[index] = found;
      setSelectedScenarios(updated);
    }
  };

  // Color theme mapping per slot
  const slotStyles = [
    { name: 'Scenario 1', badge: 'bg-sky-100 text-sky-800 border-sky-300', border: 'border-t-sky-600', bar: 'bg-sky-600', text: 'text-sky-700' },
    { name: 'Scenario 2', badge: 'bg-teal-100 text-teal-800 border-teal-300', border: 'border-t-teal-600', bar: 'bg-teal-600', text: 'text-teal-700' },
    { name: 'Scenario 3', badge: 'bg-amber-100 text-amber-800 border-amber-300', border: 'border-t-amber-600', bar: 'bg-amber-600', text: 'text-amber-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner & Tab Switch */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
            <GitCompare className="w-4 h-4 text-sky-600" />
            <span>Comparative Hydrodynamic Modeling Studio</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Multi-Scenario & Model Comparison Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Compare dam-break breach scenarios or evaluate Eulerian Grid vs SPH Particle solver formulations side by side.
          </p>
        </div>

        {/* Tab Selection Switch */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setComparisonTab('SCENARIOS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              comparisonTab === 'SCENARIOS'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Breach Scenarios
          </button>
          <button
            type="button"
            onClick={() => setComparisonTab('GRID_VS_SPH')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              comparisonTab === 'GRID_VS_SPH'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Grid vs SPH Comparison
          </button>
        </div>
      </div>

      {comparisonTab === 'GRID_VS_SPH' ? (
        /* Dedicated Grid vs SPH Side-by-Side Model Comparison Tab */
        <div className="space-y-6">
          {/* Disclaimer Banner */}
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex items-start space-x-3 text-amber-200 text-xs shadow-md">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-amber-300 uppercase">EXPERIMENTAL PROTOTYPE SOLVER NOTICE:</span>
              {" "}SPH particle results displayed below are experimental demonstrator outputs designed for Lagrangian free-surface wave visualization. They are not presented as a validated research-grade solver. Differences in numerical formulation and spatial resolution are reported neutrally.
            </div>
          </div>

          {/* Side-by-Side Visual Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel 1: Grid Model */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    2D Eulerian Grid Model Output
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono">
                  Diffusive Wave Solver
                </span>
              </div>

              {/* Graphic Representation */}
              <div className="h-48 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                <svg className="w-full h-full opacity-80" viewBox="0 0 400 200">
                  <path d="M 20 180 Q 150 140 380 40 L 380 180 Z" fill="#0284c7" fillOpacity="0.5" stroke="#0284c7" strokeWidth="2" />
                  <path d="M 20 180 Q 100 160 250 120 L 250 180 Z" fill="#06b6d4" fillOpacity="0.6" stroke="#06b6d4" strokeWidth="2" />
                </svg>
                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
                  2D Eulerian Inundation Grid Field
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Max Depth</div>
                  <div className="text-sm font-bold text-sky-400">14.6 m</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Inundation Area</div>
                  <div className="text-sm font-bold text-teal-400">184.2 km²</div>
                </div>
              </div>
            </div>

            {/* Panel 2: SPH Demonstrator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    SPH Particle Demonstrator Output
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
                  Lagrangian Particle Solver
                </span>
              </div>

              {/* Graphic Representation */}
              <div className="h-48 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                <svg className="w-full h-full opacity-80" viewBox="0 0 400 200">
                  {[...Array(40)].map((_, i) => (
                    <circle
                      key={i}
                      cx={30 + (i % 8) * 42 + Math.sin(i) * 15}
                      cy={170 - Math.floor(i / 8) * 28 + Math.cos(i) * 10}
                      r="6"
                      fill={i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#10b981' : '#f59e0b'}
                    />
                  ))}
                </svg>
                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
                  Lagrangian Particle Free-Surface Flow
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Peak Surge Speed</div>
                  <div className="text-sm font-bold text-emerald-400">22.8 m/s</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Particle Count</div>
                  <div className="text-sm font-bold text-indigo-400">96 Particles</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Numerical Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-3">
              Eulerian Grid vs SPH Particle Formulation Comparison Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Modeling Parameter</th>
                    <th className="py-3 px-4 bg-sky-50 text-sky-900">2D Grid Model (Eulerian)</th>
                    <th className="py-3 px-4 bg-indigo-50 text-indigo-900">SPH Demonstrator (Lagrangian)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Governing Formulation</td>
                    <td className="py-3 px-4 bg-sky-50/50">Fixed Cartesian Grid Cells (Finite Volume Diffusive Wave)</td>
                    <td className="py-3 px-4 bg-indigo-50/50 font-semibold text-indigo-900">Moving Fluid Particles (Kernel Smoothing W)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Free Surface Tracking</td>
                    <td className="py-3 px-4 bg-sky-50/50">Cell Water Depth Accumulation & Wet/Dry Thresholding</td>
                    <td className="py-3 px-4 bg-indigo-50/50">Natural Particle Boundary Free-Surface Tracking</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Spatial Domain Resolution</td>
                    <td className="py-3 px-4 bg-sky-50/50 font-mono">30m DEM Elevation Grid Cells</td>
                    <td className="py-3 px-4 bg-indigo-50/50 font-mono text-indigo-900">96 Fluid Particles (1.2m Kernel)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Peak Velocity Output</td>
                    <td className="py-3 px-4 bg-sky-50/50 font-mono font-bold text-sky-700">8.4 m/s</td>
                    <td className="py-3 px-4 bg-indigo-50/50 font-mono font-bold text-indigo-700">22.8 m/s (Near-Breach Surge Peak)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Mass Conservation Accuracy</td>
                    <td className="py-3 px-4 bg-sky-50/50">Strict Numerical Flux Balance (0.02% discretization loss)</td>
                    <td className="py-3 px-4 bg-indigo-50/50 font-semibold text-emerald-800">Exact Constant Particle Mass (0.00% mass loss)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Execution Runtime Speed</td>
                    <td className="py-3 px-4 bg-sky-50/50 font-mono">42.8s total domain run</td>
                    <td className="py-3 px-4 bg-indigo-50/50 font-mono">1.64s 50-frame particle run</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Recommended Application</td>
                    <td className="py-3 px-4 bg-sky-50/50">Large-scale valley inundation & HADR risk mapping</td>
                    <td className="py-3 px-4 bg-indigo-50/50">Localized dam breach surge wave & spillway dynamics</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Breach Scenarios Comparison View */
        <>
          {/* OBJECTIVE NEUTRAL DIFFERENCE NOTICE BANNER */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-sky-950 text-xs flex items-start space-x-2.5 shadow-subtle">
            <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-extrabold text-sky-900 uppercase tracking-wider block mb-0.5">
                Objective Non-Judgemental Delta Reporting Policy
              </strong>
              <p className="text-slate-700 leading-relaxed">
                In accordance with NTRO decision support standards, scenarios are evaluated strictly by calculated numerical differences. Scenarios are not ranked as "best" or "worst".
              </p>
            </div>
          </div>
        </>
      )}

      {/* 3 SCENARIO SELECTION SLOTS HEADER BAR */}
      <div className={`grid grid-cols-1 md:grid-cols-${activeScenarios.length} gap-4`}>
        {activeScenarios.map((scen, idx) => {
          const style = slotStyles[idx];
          const sim = getSim(scen);
          return (
            <div
              key={`slot-${idx}`}
              className={`bg-white border border-slate-200 border-t-4 ${style.border} rounded-lg p-4 shadow-subtle space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${style.badge}`}>
                  {style.name}
                </span>
                <span className="text-[11px] font-bold text-slate-600 font-mono">
                  {scen.failureMode}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Select Scenario:
                </label>
                <select
                  value={scen.id}
                  onChange={(e) => handleSelectScenario(idx, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-bold text-xs text-slate-900 bg-slate-50 focus:ring-2 focus:ring-sky-500"
                >
                  {mockScenarios.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              {/* Quick Specs summary */}
              <div className="p-2.5 bg-slate-50 border rounded text-[11px] space-y-1 text-slate-700 font-medium">
                <div className="flex justify-between">
                  <span>Breach Width:</span>
                  <span className="font-bold text-slate-900 font-mono">{scen.breachWidthM} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Formation Time:</span>
                  <span className="font-bold text-slate-900 font-mono">{scen.formationTimeHr} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Depth:</span>
                  <span className="font-bold text-slate-900 font-mono">{sim.maxDepthM} m</span>
                </div>
              </div>

              {/* Open Scenario CTA */}
              <button
                onClick={() => handleOpenScenario(scen)}
                className={`w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs shadow transition-all flex items-center justify-center space-x-1.5`}
              >
                <span>Open {style.name} Individually</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 3 DEDICATED PARAMETER COMPARISON CARDS (Flood Area, Max Depth, Max Velocity) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. FLOOD AREA COMPARISON CARD */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-sky-900 uppercase tracking-wider">
              <Map className="w-4 h-4 text-sky-600" />
              <span>Inundation Area Comparison</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">km²</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {activeScenarios.map((scen, idx) => {
              const sim = getSim(scen);
              const maxVal = Math.max(...activeScenarios.map((s) => getSim(s).maxFloodAreaKm2));
              const pct = Math.round((sim.maxFloodAreaKm2 / maxVal) * 100);
              const style = slotStyles[idx];
              return (
                <div key={`area-card-${scen.id}`} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-800 truncate max-w-[170px]">{style.name}: {scen.title}</span>
                    <span className="font-mono text-slate-900">{sim.maxFloodAreaKm2} km²</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border">
                    <div className={`h-full ${style.bar} transition-all`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. MAXIMUM DEPTH COMPARISON CARD */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-red-900 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-red-600" />
              <span>Maximum Depth Comparison</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">meters</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {activeScenarios.map((scen, idx) => {
              const sim = getSim(scen);
              const maxVal = Math.max(...activeScenarios.map((s) => getSim(s).maxDepthM));
              const pct = Math.round((sim.maxDepthM / maxVal) * 100);
              const style = slotStyles[idx];
              return (
                <div key={`depth-card-${scen.id}`} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-800 truncate max-w-[170px]">{style.name}: {scen.title}</span>
                    <span className="font-mono text-slate-900">{sim.maxDepthM} m</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border">
                    <div className={`h-full ${style.bar} transition-all`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. MAXIMUM VELOCITY COMPARISON CARD */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-teal-900 uppercase tracking-wider">
              <Gauge className="w-4 h-4 text-teal-600" />
              <span>Maximum Velocity Comparison</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">m/s</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {activeScenarios.map((scen, idx) => {
              const sim = getSim(scen);
              const maxVal = Math.max(...activeScenarios.map((s) => getSim(s).maxVelocityMs));
              const pct = Math.round((sim.maxVelocityMs / maxVal) * 100);
              const style = slotStyles[idx];
              return (
                <div key={`vel-card-${scen.id}`} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-800 truncate max-w-[170px]">{style.name}: {scen.title}</span>
                    <span className="font-mono text-slate-900">{sim.maxVelocityMs} m/s</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border">
                    <div className={`h-full ${style.bar} transition-all`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FULL 11-PARAMETER COMPARISON MATRIX TABLE */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-sky-600" />
            <span>Side-by-Side 11-Parameter Hydrodynamic & HADR Delta Matrix</span>
          </h3>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border">
            OBJECTIVE DELTAS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Comparison Parameter</th>
                {activeScenarios.map((scen, idx) => (
                  <th key={`hdr-${scen.id}`} className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${slotStyles[idx].badge}`}>
                      {slotStyles[idx].name}
                    </span>
                  </th>
                ))}
                <th className="py-3 px-4 text-slate-900">Calculated Difference / Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {/* 1. Reservoir Level */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-sky-600" />
                  <span>1. Reservoir Level</span>
                </td>
                {activeScenarios.map((s) => (
                  <td key={`res-${s.id}`} className="py-3 px-4 font-mono">
                    {s.reservoirWaterLevelPercent}% FRL (822.4 m)
                  </td>
                ))}
                <td className="py-3 px-4 font-mono font-bold text-sky-800">
                  Range: {Math.min(...activeScenarios.map((s) => s.reservoirWaterLevelPercent))}% - {Math.max(...activeScenarios.map((s) => s.reservoirWaterLevelPercent))}%
                </td>
              </tr>

              {/* 2. Breach Width */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">2. Breach Width</td>
                {activeScenarios.map((s) => (
                  <td key={`bw-${s.id}`} className="py-3 px-4 font-mono">
                    {s.breachWidthM} m
                  </td>
                ))}
                <td className="py-3 px-4 font-mono font-bold text-sky-800">
                  Δ = {Math.max(...activeScenarios.map((s) => s.breachWidthM)) - Math.min(...activeScenarios.map((s) => s.breachWidthM))} m
                </td>
              </tr>

              {/* 3. Breach Formation Time */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">3. Breach Formation Time</td>
                {activeScenarios.map((s) => (
                  <td key={`bt-${s.id}`} className="py-3 px-4 font-mono">
                    {s.formationTimeHr} hrs
                  </td>
                ))}
                <td className="py-3 px-4 font-mono font-bold text-sky-800">
                  Δ = {(Math.max(...activeScenarios.map((s) => s.formationTimeHr)) - Math.min(...activeScenarios.map((s) => s.formationTimeHr))).toFixed(1)} hrs
                </td>
              </tr>

              {/* 4. Simulation Duration */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">4. Simulation Duration</td>
                {activeScenarios.map((s) => (
                  <td key={`sd-${s.id}`} className="py-3 px-4 font-mono">
                    12.0 hrs (72 steps)
                  </td>
                ))}
                <td className="py-3 px-4 font-mono text-slate-500">
                  Identical (12.0 hrs)
                </td>
              </tr>

              {/* 5. Maximum Depth */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-red-600" />
                  <span>5. Maximum Depth</span>
                </td>
                {activeScenarios.map((s) => (
                  <td key={`md-${s.id}`} className="py-3 px-4 font-mono font-bold text-slate-900">
                    {getSim(s).maxDepthM} m
                  </td>
                ))}
                <td className="py-3 px-4 font-mono font-bold text-red-700">
                  Δ = {(Math.max(...activeScenarios.map((s) => getSim(s).maxDepthM)) - Math.min(...activeScenarios.map((s) => getSim(s).maxDepthM))).toFixed(1)} m
                </td>
              </tr>

              {/* 6. Maximum Velocity */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                  <Gauge className="w-3.5 h-3.5 text-teal-600" />
                  <span>6. Maximum Velocity</span>
                </td>
                {activeScenarios.map((s) => (
                  <td key={`mv-${s.id}`} className="py-3 px-4 font-mono font-bold text-slate-900">
                    {getSim(s).maxVelocityMs} m/s
                  </td>
                ))}
                <td className="py-3 px-4 font-mono font-bold text-teal-700">
                  Δ = {(Math.max(...activeScenarios.map((s) => getSim(s).maxVelocityMs)) - Math.min(...activeScenarios.map((s) => getSim(s).maxVelocityMs))).toFixed(1)} m/s
                </td>
              </tr>

              {/* 7. Inundation Area */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                  <Map className="w-3.5 h-3.5 text-sky-600" />
                  <span>7. Inundation Area</span>
                </td>
                {activeScenarios.map((s) => (
                  <td key={`ia-${s.id}`} className="py-3 px-4 font-mono font-bold text-slate-900">
                    {getSim(s).maxFloodAreaKm2} km²
                  </td>
                ))}
                <td className="py-3 px-4 font-mono font-bold text-sky-700">
                  Δ = {(Math.max(...activeScenarios.map((s) => getSim(s).maxFloodAreaKm2)) - Math.min(...activeScenarios.map((s) => getSim(s).maxFloodAreaKm2))).toFixed(1)} km²
                </td>
              </tr>

              {/* 8. Flood Arrival Time */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>8. Flood Arrival Time</span>
                </td>
                {activeScenarios.map((s) => (
                  <td key={`at-${s.id}`} className="py-3 px-4 font-mono">
                    {getSim(s).peakFlowTimeHr ? `${(getSim(s).peakFlowTimeHr * 0.1).toFixed(1)} hrs` : '0.2 hrs'}
                  </td>
                ))}
                <td className="py-3 px-4 font-mono font-bold text-amber-700">
                  First Wave Range: 0.2 hrs - 0.4 hrs
                </td>
              </tr>

              {/* 9. Affected Buildings */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>9. Affected Buildings</span>
                </td>
                {activeScenarios.map((s) => {
                  const count = Math.round(s.breachWidthM * 2.8);
                  return (
                    <td key={`ab-${s.id}`} className="py-3 px-4 font-mono">
                      {count} units
                    </td>
                  );
                })}
                <td className="py-3 px-4 font-mono font-bold text-indigo-800">
                  Range: {Math.min(...activeScenarios.map((s) => Math.round(s.breachWidthM * 2.8)))} - {Math.max(...activeScenarios.map((s) => Math.round(s.breachWidthM * 2.8)))} units
                </td>
              </tr>

              {/* 10. Affected Roads */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                  <Navigation className="w-3.5 h-3.5 text-sky-600" />
                  <span>10. Affected Roads</span>
                </td>
                {activeScenarios.map((s) => {
                  const km = Math.round(getSim(s).maxFloodAreaKm2 * 0.35 * 10) / 10;
                  return (
                    <td key={`ar-${s.id}`} className="py-3 px-4 font-mono">
                      {km} km
                    </td>
                  );
                })}
                <td className="py-3 px-4 font-mono font-bold text-sky-800">
                  Range: {Math.min(...activeScenarios.map((s) => Math.round(getSim(s).maxFloodAreaKm2 * 0.35 * 10) / 10))} - {Math.max(...activeScenarios.map((s) => Math.round(getSim(s).maxFloodAreaKm2 * 0.35 * 10) / 10))} km
                </td>
              </tr>

              {/* 11. Affected Critical Infrastructure */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>11. Affected Critical Infrastructure</span>
                </td>
                {activeScenarios.map((s) => {
                  const count = Math.round(getSim(s).maxDepthM > 10 ? 8 : getSim(s).maxDepthM > 8 ? 5 : 2);
                  return (
                    <td key={`infra-${s.id}`} className="py-3 px-4 font-mono font-bold">
                      {count} facilities
                    </td>
                  );
                })}
                <td className="py-3 px-4 font-mono font-bold text-red-700">
                  Facilities Range: 2 - 8 Submerged
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* MULTI-SCENARIO GIS MAP COMPARISON OVERLAY */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center space-x-2">
            <Map className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Multi-Scenario Map Overlay Comparison
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            {activeScenarios.map((scen, idx) => (
              <span key={`map-legend-${scen.id}`} className="flex items-center space-x-1">
                <span className={`w-3 h-3 rounded-full ${slotStyles[idx].bar}`}></span>
                <span className="font-bold text-slate-700">{slotStyles[idx].name}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="h-[480px] relative rounded-lg overflow-hidden border border-slate-300 shadow-panel">
          <GISMapModule height="100%" showControls={true} />
        </div>
      </div>
    </div>
  );
};
