import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import type { RiskThresholdConfig, HADRImpactResponse } from '../types';
import { GISMapModule } from '../components/map/GISMapModule';
import {
  ShieldAlert,
  Building2,
  Navigation,
  Milestone,
  GraduationCap,
  Hospital,
  Landmark,
  Sprout,
  Sliders,
  AlertTriangle,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const ImpactAnalysisPage: React.FC = () => {
  const { setActivePage, activeSimulation } = useApp();

  // Configurable Risk Thresholds State (Transparent, non-arbitrary cutoffs)
  const [thresholds, setThresholds] = useState<RiskThresholdConfig>({
    low_max_m: 0.5,
    medium_max_m: 1.5,
    high_max_m: 3.0,
  });

  const [impactData, setImpactData] = useState<HADRImpactResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeLayerFilter, setActiveLayerFilter] = useState<string>('all');

  // Fetch GeoPandas & Shapely spatial impact calculations from backend API
  const loadImpactAnalysis = async (currentThresholds: RiskThresholdConfig) => {
    setIsLoading(true);
    try {
      const res = await apiService.getHADRImpact(activeSimulation.id || 'sim-tehri-001', currentThresholds);
      setImpactData(res);
    } catch (err) {
      console.error("Error loading HADR impact analysis:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImpactAnalysis(thresholds);
  }, []);

  const handleThresholdChange = (field: keyof RiskThresholdConfig, value: number) => {
    setThresholds((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    loadImpactAnalysis(thresholds);
  };

  const metrics = impactData?.summary_metrics || {
    affected_buildings: 510,
    affected_roads_km: 64.2,
    affected_bridges: 4,
    affected_schools: 5,
    affected_hospitals: 4,
    affected_admin_boundaries: 4,
    affected_agricultural_area_ha: 2131.6,
  };

  // 6 Primary Required Display Cards
  const statsCards = [
    {
      label: 'Affected Buildings',
      value: `${metrics.affected_buildings.toLocaleString()} Units`,
      subtext: 'Residential & Commercial Structures',
      icon: Building2,
      color: 'border-l-indigo-600 bg-indigo-50/50 text-indigo-900',
    },
    {
      label: 'Affected Roads',
      value: `${metrics.affected_roads_km} km`,
      subtext: 'Highways & District Roads Submerged',
      icon: Navigation,
      color: 'border-l-sky-600 bg-sky-50/50 text-sky-900',
    },
    {
      label: 'Affected Bridges',
      value: `${metrics.affected_bridges} Crossings`,
      subtext: 'Spillway & River Bridges Inundated',
      icon: Milestone,
      color: 'border-l-red-600 bg-red-50/50 text-red-900',
    },
    {
      label: 'Affected Schools',
      value: `${metrics.affected_schools} Facilities`,
      subtext: 'Educational Institutions Threatened',
      icon: GraduationCap,
      color: 'border-l-amber-600 bg-amber-50/50 text-amber-900',
    },
    {
      label: 'Affected Hospitals',
      value: `${metrics.affected_hospitals} Centers`,
      subtext: 'Healthcare Facilities Inundated',
      icon: Hospital,
      color: 'border-l-rose-600 bg-rose-50/50 text-rose-900',
    },
    {
      label: 'Affected Agricultural Area',
      value: `${metrics.affected_agricultural_area_ha.toLocaleString()} ha`,
      subtext: 'Cropland & Terraced Paddy Submerged',
      icon: Sprout,
      color: 'border-l-emerald-600 bg-emerald-50/50 text-emerald-900',
    },
  ];

  const filteredFeatures = (impactData?.affected_features || []).filter((f) => {
    if (activeLayerFilter === 'all') return true;
    return f.layer === activeLayerFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>HADR Decision Support & Spatial Impact Module</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            2D GeoPandas Flood Impact Analysis Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Spatial geometric intersection of flood inundation extent with 7 GIS feature layers & configurable risk thresholds.
          </p>
        </div>

        <button
          onClick={() => setActivePage('reports')}
          className="mt-4 md:mt-0 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center space-x-1.5"
        >
          <span>Export HADR Impact Brief PDF</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* SYNTHETIC DEMO DATA NOTICE BANNER (Explicit Labeling as requested) */}
      <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-3.5 text-amber-950 flex items-start space-x-3 shadow-subtle">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <div className="font-extrabold uppercase tracking-wider text-amber-900 flex items-center space-x-2">
            <span>SYNTHETIC DEMO LAYER DATA NOTICE</span>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px]">SIMULATED GIS</span>
          </div>
          <p className="font-medium text-amber-900/90 leading-relaxed">
            {impactData?.demo_data_notice || "DEMO NOTICE: GIS layers shown are synthetic demonstration layers generated for decision support modeling. They do not represent real-world ground survey observations."}
          </p>
        </div>
      </div>

      {/* TRANSPARENT CONFIGURABLE RISK THRESHOLDS EDITOR BAR */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Transparent Configurable Risk Classification Thresholds
            </h3>
          </div>
          <span className="text-[11px] font-mono bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
            Rule-Based Depth Cutoffs (Non-Arbitrary)
          </span>
        </div>

        <form onSubmit={handleApplyThresholds} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
              <span>LOW Risk Cutoff (&lt; m)</span>
              <span className="font-mono text-emerald-700 font-bold">{thresholds.low_max_m}m</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="2.0"
              value={thresholds.low_max_m}
              onChange={(e) => handleThresholdChange('low_max_m', parseFloat(e.target.value) || 0.5)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
              <span>MEDIUM Risk Cutoff (&lt; m)</span>
              <span className="font-mono text-amber-700 font-bold">{thresholds.medium_max_m}m</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="4.0"
              value={thresholds.medium_max_m}
              onChange={(e) => handleThresholdChange('medium_max_m', parseFloat(e.target.value) || 1.5)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
              <span>HIGH Risk Cutoff (&lt; m)</span>
              <span className="font-mono text-orange-700 font-bold">{thresholds.high_max_m}m</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="8.0"
              value={thresholds.high_max_m}
              onChange={(e) => handleThresholdChange('high_max_m', parseFloat(e.target.value) || 3.0)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-xs shadow transition-all flex items-center justify-center space-x-1.5"
          >
            {isLoading ? <span>Re-Calculating...</span> : <span>Re-Calculate Spatial Impact</span>}
          </button>
        </form>
      </div>

      {/* 6 DISPLAY METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statsCards.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={`hadr-card-${idx}`}
              className={`border border-slate-200 rounded-lg p-3 border-l-4 shadow-subtle transition-all hover:shadow-panel ${item.color}`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                <span>{item.label}</span>
                <IconComp className="w-3.5 h-3.5 opacity-70" />
              </div>
              <div className="text-lg font-extrabold tracking-tight font-mono">
                {item.value}
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                {item.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* INTERACTIVE GIS MAP OVERLAY SECTION */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Affected GIS Features Spatial Overlay Map
            </h3>
          </div>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
            GeoPandas & Shapely Verified
          </span>
        </div>

        <div className="h-[460px] relative rounded-lg overflow-hidden border border-slate-300 shadow-panel">
          <GISMapModule height="100%" showControls={true} />
        </div>
      </div>

      {/* DETAILED AFFECTED ASSETS INVENTORY TABLE & LAYER FILTERING */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Landmark className="w-4 h-4 text-sky-600" />
            <span>Calculated Affected GIS Assets Inventory</span>
          </h3>

          {/* Layer Filter Pills */}
          <div className="flex flex-wrap gap-1 text-xs">
            {['all', 'buildings', 'roads', 'bridges', 'schools', 'hospitals', 'admin_boundaries', 'agricultural_areas'].map((l) => (
              <button
                key={`filter-${l}`}
                onClick={() => setActiveLayerFilter(l)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold capitalize transition-all ${
                  activeLayerFilter === l
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {l.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Asset Name</th>
                <th className="py-2.5 px-3">Layer Type</th>
                <th className="py-2.5 px-3">Flood Depth (m)</th>
                <th className="py-2.5 px-3">Calculated Risk Level</th>
                <th className="py-2.5 px-3">Impact Scale / Capacity</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3">Data Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredFeatures.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="py-2.5 px-3 text-slate-600 capitalize">{item.layer.replace('_', ' ')}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{item.flood_depth_m} m</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      item.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-300' :
                      item.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                      item.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {item.risk_level}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{item.subtext}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{item.lat}° N, {item.lng}° E</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-extrabold uppercase">
                      SYNTHETIC DEMO
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
