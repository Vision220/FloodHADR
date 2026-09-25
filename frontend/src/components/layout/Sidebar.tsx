import React from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_STEPS } from '../../data/demoStepsData';
import type { PageId } from '../../types';
import {
  LayoutDashboard,
  MapPin,
  Database,
  Flame,
  PlayCircle,
  Map,
  ShieldAlert,
  GitCompare,
  Globe,
  FileText,
  Settings,
  Sparkles,
  Box,
  GitBranch,
  Shield,
  CloudRain,
  Zap,
  Thermometer,
  Mountain,
  Cpu,
  Radio,
  Activity
} from 'lucide-react';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  demoStep?: number;
}

export const Sidebar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    isDemoMode,
    startDemoMode,
    currentDemoStep,
    goToDemoStep
  } = useApp();

  const navItems: NavItem[] = [
    { id: 'command-center', label: 'Command Center', icon: Activity, badge: 'COMMAND' },
    { id: 'earth-engine', label: 'Google Earth Engine', icon: Globe, badge: 'GEE EO' },
    { id: '3d-flood-twin', label: '3D Flood Digital Twin', icon: Box, badge: 'NEW 3D' },
    { id: 'dashboard', label: 'Legacy / Demo Dashboard', icon: LayoutDashboard, badge: 'DEMO' },
    { id: 'study-area', label: 'Study Area & Network', icon: MapPin, demoStep: 1 },
    { id: 'basin-intelligence', label: 'Basin Intelligence', icon: GitBranch, badge: 'HYDRO GIS' },
    { id: 'dam-reservoir', label: 'Dam & Reservoir', icon: Shield, badge: 'DAM ENG' },
    { id: 'rainfall', label: 'Rainfall & SCS-CN', icon: CloudRain, badge: 'SCS-CN' },
    { id: 'compound-flood', label: 'Tributary Flash Flood', icon: Zap, badge: 'MULTI-HAZARD' },
    { id: 'climate', label: 'Climate Risk', icon: Thermometer, badge: 'IPCC AR6' },
    { id: 'landslide', label: 'Landslide & Blockage', icon: Mountain, badge: 'GEOTECH' },
    { id: 'simulation', label: 'Hydrodynamic Solver', icon: PlayCircle, demoStep: 4 },
    { id: 'multi-model', label: 'AI / ANN & Comparison', icon: Cpu, badge: 'MULTI-MODEL' },
    { id: 'realtime-sensors', label: 'Real-Time Telemetry', icon: Radio, badge: 'LIVE IoT' },
    { id: 'predictive-ensemble', label: 'Predictive Ensemble', icon: Sparkles, badge: 'ENSEMBLE' },
    { id: 'data', label: 'Data Input', icon: Database, demoStep: 2 },
    { id: 'dam-break', label: 'Dam Break Scenario', icon: Flame, demoStep: 3 },
    { id: 'simulation-3d', label: '3D Twin Simulation', icon: Box, badge: '3D TWIN' },
    { id: 'flood-map', label: 'Flood Map & GIS', icon: Map, demoStep: 5 },
    { id: 'impact-analysis', label: 'HADR Impact Analysis', icon: ShieldAlert, badge: 'HADR', demoStep: 6 },
    { id: 'scenario-comparison', label: 'Scenario Matrix', icon: GitCompare, demoStep: 7 },
    { id: 'satellite', label: 'Satellite EO / SAR', icon: Globe, badge: 'EO/SAR' },
    { id: 'reports', label: 'Reports & Export', icon: FileText, demoStep: 8 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-[calc(100vh-4rem)] sticky top-16 shadow-lg select-none">
      
      {/* Demo Mode Quick Banner inside Sidebar */}
      <div className="p-3 mx-3 mt-3 bg-gradient-to-r from-amber-500/15 via-slate-800 to-emerald-500/15 border border-amber-500/30 rounded-xl text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 font-bold text-amber-300 uppercase tracking-wider text-[10px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Demonstration Mode</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
            ~5 min
          </span>
        </div>

        {isDemoMode ? (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-white flex items-center justify-between">
              <span>Active: Step {currentDemoStep} of 8</span>
              <span className="text-emerald-400 text-[10px] font-mono font-bold">LIVE</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {DEMO_STEPS.map((s) => (
                <button
                  key={s.step}
                  onClick={() => goToDemoStep(s.step)}
                  className={`py-1 rounded text-[10px] font-bold font-mono transition-all ${
                    currentDemoStep === s.step
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : currentDemoStep > s.step
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                  title={`Step ${s.step}: ${s.title}`}
                >
                  S{s.step}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={startDemoMode}
            className="w-full py-1.5 bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black rounded-lg text-xs shadow transition-all flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>START DEMO MODE</span>
          </button>
        )}
      </div>

      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Platform Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const isCurrentDemoTarget = isDemoMode && item.demoStep === currentDemoStep;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                if (isDemoMode && item.demoStep) {
                  goToDemoStep(item.demoStep as any);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isCurrentDemoTarget
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg ring-2 ring-amber-300/50'
                  : isActive
                  ? 'bg-sky-600 text-white font-semibold shadow-md shadow-sky-900/40'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isCurrentDemoTarget ? 'text-slate-950' : isActive ? 'text-white' : 'text-sky-400'}`} />
                <span>{item.label}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                {item.demoStep && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                    isCurrentDemoTarget
                      ? 'bg-slate-950 text-amber-300'
                      : 'text-slate-500'
                  }`}>
                    STEP {item.demoStep}
                  </span>
                )}
                {item.badge && !isCurrentDemoTarget && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${
                    isActive ? 'bg-sky-700 text-white' : 'bg-teal-950 text-teal-400 border border-teal-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 m-3 bg-slate-850 border border-slate-800 rounded-lg text-slate-400 text-xs">
        <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
          <span>NTRO Hydro Core</span>
          <span className="text-[10px] text-teal-400 font-mono">v1.0.4-dev</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          2D Diffusive Wave Solver active. Delft3D / SPH adapters standby.
        </p>
      </div>
    </aside>
  );
};
