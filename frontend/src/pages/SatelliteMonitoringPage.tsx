import React, { useState, useEffect } from 'react';
import {
  Globe,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Sliders,
  ShieldCheck,
  MapPin,
  Activity,
  Database,
  Cpu
} from 'lucide-react';
import { apiService } from '../services/api';
import type {
  SatelliteSourceItem,
  StudyAreaOption,
  SatelliteProviderOption,
  SatelliteResultResponse
} from '../types';

export const SatelliteMonitoringPage: React.FC = () => {
  const [sources, setSources] = useState<SatelliteSourceItem[]>([]);
  const [studyAreas, setStudyAreas] = useState<StudyAreaOption[]>([]);
  const [, setProviders] = useState<SatelliteProviderOption[]>([]);
  
  // Selection state
  const [selectedStudyArea, setSelectedStudyArea] = useState<string>('TEHRI_RISHIKESH');
  const [selectedSource, setSelectedSource] = useState<string>('Sentinel-1 SAR');
  const [beforeDate, setBeforeDate] = useState<string>('2026-08-01');
  const [afterDate, setAfterDate] = useState<string>('2026-08-15');
  const [selectedProvider, setSelectedProvider] = useState<string>('DEMO');

  // Execution result state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SatelliteResultResponse | null>(null);
  const [geeWarning, setGeeWarning] = useState<string | null>(null);

  // Map layer toggle state
  const [showSatelliteExtent, setShowSatelliteExtent] = useState<boolean>(true);
  const [showModelExtent, setShowModelExtent] = useState<boolean>(true);
  const [showDifferenceLayer, setShowDifferenceLayer] = useState<boolean>(true);
  const [layerOpacity, setLayerOpacity] = useState<number>(0.75);

  // Load initial options
  useEffect(() => {
    async function loadOptions() {
      const data = await apiService.getSatelliteSources();
      setSources(data.sources || []);
      setStudyAreas(data.study_areas || []);
      setProviders(data.providers || []);
    }
    loadOptions();
  }, []);

  // Run monitoring pipeline initial load or on button click
  const executePipeline = async () => {
    setIsLoading(true);
    setGeeWarning(null);

    if (selectedProvider === 'GEE') {
      setGeeWarning(
        "Google Earth Engine (GEE) credentials are not configured in this environment. Falling back gracefully to DEMO Satellite Provider."
      );
    }

    try {
      const res = await apiService.runSatelliteMonitoring({
        study_area_id: selectedStudyArea,
        satellite_source: selectedSource,
        before_date: beforeDate,
        after_date: afterDate,
        provider_type: selectedProvider,
      });
      setResult(res);
    } catch (e: any) {
      console.error("Failed to run satellite monitoring pipeline", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executePipeline();
  }, []);

  const metrics = result?.stage_5_model_comparison?.metrics;
  const stage1 = result?.stage_1_acquisition;
  const stage3 = result?.stage_3_water_detection;
  const stage4 = result?.stage_4_flood_extent;

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Satellite Flood Monitoring
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  DEMO DATA MODE
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                5-Stage Earth Observation (EO) SAR & Multi-Spectral Water Detection Pipeline & Hydro Model Validation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={executePipeline}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-lg shadow-sky-950 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Processing EO Pipeline...' : 'Run Extraction Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Prominent DEMO DATA Notice Banner */}
      <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200 leading-relaxed">
          <span className="font-bold text-amber-300">DEMO DATA NOTICE:</span> The satellite layers and extraction metrics below are synthetic demo datasets generated for prototype evaluation. They are clearly labeled as <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-200">DEMO DATA</code> and do not represent live Google Earth Engine (GEE) cloud execution. Pluggable service architecture supports live GEE credentials via <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-200">GoogleEarthEngineProvider</code> interface without code changes.
        </div>
      </div>

      {geeWarning && (
        <div className="bg-sky-950/40 border border-sky-500/40 rounded-xl p-3 text-xs text-sky-300 flex items-center space-x-2">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{geeWarning}</span>
        </div>
      )}

      {/* 5-Stage Satellite Pipeline Flowchart Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              5-Stage Earth Observation Processing Pipeline Architecture
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Pluggable Provider API</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { num: 1, name: 'Acquisition', desc: 'Sentinel SAR / Optical imagery retrieval', icon: Database, color: 'text-cyan-400', border: 'border-cyan-500/30' },
            { num: 2, name: 'Preprocessing', desc: 'Speckle filtering & DEM geocoding', icon: Cpu, color: 'text-indigo-400', border: 'border-indigo-500/30' },
            { num: 3, name: 'Water Detection', desc: 'SAR Backscatter / MNDWI ratio', icon: Layers, color: 'text-sky-400', border: 'border-sky-500/30' },
            { num: 4, name: 'Flood Extent', desc: 'Baseline river mask subtraction', icon: Zap, color: 'text-teal-400', border: 'border-teal-500/30' },
            { num: 5, name: 'Model Compare', desc: 'Confusion matrix & CSI validation', icon: ShieldCheck, color: 'text-emerald-400', border: 'border-emerald-500/30' }
          ].map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.num}
                className={`bg-slate-950/80 border ${stage.border} rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      STAGE 0{stage.num}
                    </span>
                    <Icon className={`w-4 h-4 ${stage.color}`} />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">{stage.name}</h3>
                  <p className="text-[11px] text-slate-400 leading-snug">{stage.desc}</p>
                </div>

                <div className="mt-3 flex items-center space-x-1.5 text-[10px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>COMPLETED</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Controls Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              EO Observation Parameters
            </h3>
          </div>

          {/* Study Area Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Study Area Boundary
            </label>
            <select
              value={selectedStudyArea}
              onChange={(e) => setSelectedStudyArea(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              {studyAreas.map((sa) => (
                <option key={sa.id} value={sa.id}>{sa.name}</option>
              ))}
            </select>
          </div>

          {/* Satellite Constellation Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Satellite Source Constellation
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.resolution})</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              {sources.find(s => s.id === selectedSource)?.description}
            </p>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Pre-Flood Date
              </label>
              <input
                type="date"
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Post-Flood Date
              </label>
              <input
                type="date"
                value={afterDate}
                onChange={(e) => setAfterDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Service Provider Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Satellite Engine Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedProvider('DEMO')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  selectedProvider === 'DEMO'
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Demo Provider
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvider('GEE')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  selectedProvider === 'GEE'
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Google Earth Engine
              </button>
            </div>
          </div>

          {/* Map Layer Opacity & Toggles */}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Map Layer Controls
            </label>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center space-x-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={showSatelliteExtent}
                  onChange={(e) => setShowSatelliteExtent(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-0"
                />
                <span>Satellite Extent (Cyan)</span>
              </label>
              <label className="flex items-center space-x-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={showModelExtent}
                  onChange={(e) => setShowModelExtent(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-0"
                />
                <span>Simulated Hydro Model (Purple)</span>
              </label>
              <label className="flex items-center space-x-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={showDifferenceLayer}
                  onChange={(e) => setShowDifferenceLayer(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-0"
                />
                <span>Spatial Match Matrix Layer</span>
              </label>
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Layer Opacity</span>
                <span>{Math.round(layerOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={layerOpacity}
                onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>
        </div>

        {/* 5 Display Cards */}
        <div className="lg:col-span-3 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Before Image */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Before Image</span>
                <span className="text-cyan-400 font-mono">Baseline</span>
              </div>
              <div className="text-sm font-bold text-white">
                {stage1?.before_image?.scene_id || 'EO_DEMO_BEFORE'}
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800 font-mono text-[11px]">
                <div>Date: {beforeDate}</div>
                <div>Resolution: {stage1?.acquisition_details?.resolution_m || 10}m</div>
                <div>Quality Score: {stage1?.before_image?.quality_score || 96.5}%</div>
              </div>
            </div>

            {/* Card 2: After Image */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>After Image</span>
                <span className="text-amber-400 font-mono">Post-Event</span>
              </div>
              <div className="text-sm font-bold text-white">
                {stage1?.after_image?.scene_id || 'EO_DEMO_AFTER'}
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800 font-mono text-[11px]">
                <div>Date: {afterDate}</div>
                <div>Sensor: {selectedSource}</div>
                <div>Quality Score: {stage1?.after_image?.quality_score || 94.2}%</div>
              </div>
            </div>

            {/* Card 3: Detected Water Extent */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Detected Water</span>
                <span className="text-sky-400 font-mono">Stage 3</span>
              </div>
              <div className="text-xl font-bold text-sky-400">
                {stage3?.total_water_area_km2 || 38.65} <span className="text-xs text-slate-400 font-normal">km²</span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800 text-[11px]">
                <div>Method: {stage3?.detection_method?.algorithm || 'SAR Backscatter'}</div>
                <div>Confidence: {stage3?.detection_method?.confidence_level || '92.8%'}</div>
              </div>
            </div>

            {/* Card 4: Flood Extent */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Extracted Flood</span>
                <span className="text-emerald-400 font-mono">Stage 4</span>
              </div>
              <div className="text-xl font-bold text-emerald-400">
                {stage4?.flood_area_km2 || 28.45} <span className="text-xs text-slate-400 font-normal">km²</span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800 text-[11px]">
                <div>Subtracted River: {stage4?.permanent_water_subtracted_km2 || 10.20} km²</div>
                <div>Pixels: {(stage4?.flooded_pixels_count || 284500).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Model vs Satellite Spatial Agreement Matrix Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Model vs Satellite Spatial Accuracy Metrics (Stage 5)
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                CSI Score: {metrics?.critical_success_index || 0.7609}
              </span>
            </div>

            {/* Metrics KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Critical Success Index</div>
                <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                  {metrics?.critical_success_index || 0.7609}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">CSI / Jaccard IoU</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Precision</div>
                <div className="text-lg font-bold text-sky-400 mt-1 font-mono">
                  {metrics?.precision || 0.8478}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">TP / (TP + FP)</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Recall / Sensitivity</div>
                <div className="text-lg font-bold text-indigo-400 mt-1 font-mono">
                  {metrics?.recall || 0.8813}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">TP / (TP + FN)</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">F1 Validation Score</div>
                <div className="text-lg font-bold text-teal-400 mt-1 font-mono">
                  {metrics?.f1_score || 0.8642}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Harmonic Mean</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center col-span-2 md:col-span-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Spatial Agreement</div>
                <div className="text-lg font-bold text-cyan-400 mt-1 font-mono">
                  {metrics?.spatial_agreement_percent || 94.61}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Overall Accuracy</div>
              </div>
            </div>

            {/* Confusion Matrix Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Classification Category</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Area (km²)</th>
                    <th className="py-2.5 px-3 text-center">Map Legend Color</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-emerald-400">TRUE POSITIVE (TP)</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">Spatial Agreement (Confirmed by Satellite EO & Hydro Model)</td>
                    <td className="py-2 px-3 text-right font-bold">{metrics?.true_positive_area_km2 || 24.12}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block w-3 h-3 rounded bg-emerald-500 shadow"></span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-amber-400">FALSE POSITIVE (FP)</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">Satellite Only (Hydro Model Under-prediction)</td>
                    <td className="py-2 px-3 text-right font-bold">{metrics?.false_positive_area_km2 || 4.33}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block w-3 h-3 rounded bg-amber-500 shadow"></span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-red-400">FALSE NEGATIVE (FN)</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">Model Only (Satellite EO Under-detection / Shadow)</td>
                    <td className="py-2 px-3 text-right font-bold">{metrics?.false_negative_area_km2 || 3.25}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block w-3 h-3 rounded bg-red-500 shadow"></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Visual Map View Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Satellite vs Hydrodynamic Model GIS Spatial Map View
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono">
                  Tehri-Rishikesh Sector (78.20°E, 30.05°N - 78.62°E, 30.42°N)
                </span>
              </div>
            </div>

            {/* Map Container Mockup with Layer Legend & Coordinates */}
            <div className="relative h-[380px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between p-4">
              {/* Background GIS Grid Pattern Simulation */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

              {/* Synthetic Satellite & Model Polygon Visualization Overlays */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-full h-full opacity-80" viewBox="0 0 800 400">
                  {/* Baseline Bhagirathi / Ganga River Channel */}
                  <path
                    d="M 120 40 Q 250 120 380 180 T 680 340"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />

                  {/* Satellite Extent Overlay (Cyan Polygon) */}
                  {showSatelliteExtent && (
                    <polygon
                      points="110,35 270,110 410,170 700,345 660,360 360,195 230,135 100,50"
                      fill="#06b6d4"
                      fillOpacity={layerOpacity * 0.4}
                      stroke="#06b6d4"
                      strokeWidth="2"
                    />
                  )}

                  {/* Hydrodynamic Model Extent Overlay (Purple Polygon) */}
                  {showModelExtent && (
                    <polygon
                      points="115,42 265,115 400,175 690,340 655,355 355,190 225,130 105,45"
                      fill="#a855f7"
                      fillOpacity={layerOpacity * 0.4}
                      stroke="#a855f7"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* Spatial Difference Layer (True Positive = Green, FP = Amber, FN = Red) */}
                  {showDifferenceLayer && (
                    <g opacity={layerOpacity}>
                      {/* True Positive Agreement Zone */}
                      <polygon
                        points="120,45 260,115 395,175 675,340 650,352 355,188 228,132 110,48"
                        fill="#10b981"
                        fillOpacity="0.6"
                      />
                      {/* False Positive (Satellite Only) */}
                      <polygon
                        points="270,110 320,135 300,140 265,115"
                        fill="#f59e0b"
                        fillOpacity="0.7"
                      />
                      {/* False Negative (Model Only) */}
                      <polygon
                        points="680,340 700,345 690,355 675,340"
                        fill="#ef4444"
                        fillOpacity="0.7"
                      />
                    </g>
                  )}
                </svg>
              </div>

              {/* Map Floating Top Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Spatial Alignment Active</span>
                </div>

                <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-300">
                  CRS: EPSG:4326 (WGS 84)
                </div>
              </div>

              {/* Map Floating Bottom Legend */}
              <div className="relative z-10 bg-slate-900/90 backdrop-blur border border-slate-700/80 p-3 rounded-lg text-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500"></span>
                    <span className="text-slate-200 text-[11px]">True Positive (Match)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500"></span>
                    <span className="text-slate-200 text-[11px]">Satellite Only (FP)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-red-500"></span>
                    <span className="text-slate-200 text-[11px]">Model Only (FN)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-sky-500"></span>
                    <span className="text-slate-200 text-[11px]">Baseline River Channel</span>
                  </div>
                </div>

                <div className="text-[10px] text-amber-300 font-semibold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  DEMO DATA LAYER
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
