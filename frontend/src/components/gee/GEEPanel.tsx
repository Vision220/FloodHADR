import React, { useState } from 'react';
import { GEEStatus } from './GEEStatus';
import { GEEImagery } from './GEEImagery';
import { GEERainfall } from './GEERainfall';
import { GEEFloodAnalysis } from './GEEFloodAnalysis';
import { GEELandCover } from './GEELandCover';
import { GEEWaterAnalysis } from './GEEWaterAnalysis';
import { GEEChangeDetection } from './GEEChangeDetection';
import { Globe, Layers, Activity, ShieldAlert, FileText, Database } from 'lucide-react';

export const GEEPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'imagery' | 'rainfall' | 'flood' | 'landcover' | 'water' | 'change'>('imagery');

  return (
    <div className="space-y-4 select-none font-sans">
      
      {/* Top Banner Status Card */}
      <GEEStatus />

      {/* Earth Engine Tab Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex flex-wrap items-center gap-1.5 text-xs font-mono font-bold">
        <button
          onClick={() => setActiveTab('imagery')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
            activeTab === 'imagery' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Sentinel-2 Imagery</span>
        </button>

        <button
          onClick={() => setActiveTab('rainfall')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
            activeTab === 'rainfall' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>CHIRPS Rainfall</span>
        </button>

        <button
          onClick={() => setActiveTab('flood')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
            activeTab === 'flood' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>SAR Flood & IoU</span>
        </button>

        <button
          onClick={() => setActiveTab('landcover')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
            activeTab === 'landcover' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>LULC Land Cover</span>
        </button>

        <button
          onClick={() => setActiveTab('water')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
            activeTab === 'water' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Water Monitoring</span>
        </button>

        <button
          onClick={() => setActiveTab('change')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
            activeTab === 'change' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Change Detection</span>
        </button>
      </div>

      {/* Render Selected GEE Analysis Sub-module */}
      <div className="transition-all">
        {activeTab === 'imagery' && <GEEImagery />}
        {activeTab === 'rainfall' && <GEERainfall />}
        {activeTab === 'flood' && <GEEFloodAnalysis />}
        {activeTab === 'landcover' && <GEELandCover />}
        {activeTab === 'water' && <GEEWaterAnalysis />}
        {activeTab === 'change' && <GEEChangeDetection />}
      </div>

      {/* Scientific Data Provenance & Source Tag Summary (Phase 21 & 28) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] font-mono text-slate-400 space-y-1">
        <div className="flex justify-between items-center text-slate-300 font-bold border-b border-slate-800 pb-1">
          <span className="flex items-center space-x-1">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Scientific Data Classification Standards</span>
          </span>
          <span className="text-emerald-400">NTRO PS ID 26161</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-slate-400">
          <div><span className="text-emerald-400 font-bold">[OBSERVED]</span> Real satellite/telemetry</div>
          <div><span className="text-purple-400 font-bold">[DERIVED]</span> SAR thresholding / NDVI</div>
          <div><span className="text-sky-400 font-bold">[SIMULATED]</span> Hydrodynamic depth core</div>
          <div><span className="text-amber-400 font-bold">[DEMO]</span> Baseline offline mode</div>
        </div>
      </div>

    </div>
  );
};
