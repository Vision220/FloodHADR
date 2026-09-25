import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  ShieldAlert,
  Download,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ModelMetadata {
  model_id: string;
  model_name: string;
  model_type: string;
  is_installed_and_tested: boolean;
  model_notice: string;
}

interface ModelResult {
  metadata: ModelMetadata;
  results_available: boolean;
  training_status?: string;
  model_notice?: string;
  export_deck?: Record<string, any>;
  outputs?: {
    peak_discharge_m3s: number;
    max_water_depth_m: number;
    max_velocity_ms: number;
    flood_inundation_area_km2: number;
    peak_arrival_time_hr: number;
    execution_time_ms: number;
  };
}

interface ComparisonStudioResponse {
  status: string;
  comparison_matrix: ModelResult[];
  summary_notice: string;
}

export const ModelComparisonPage: React.FC = () => {
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [peakQ, setPeakQ] = useState<number>(12500);
  const [rainfallMm, setRainfallMm] = useState<number>(180);
  const [scsCn, setScsCn] = useState<number>(78);
  const [results, setResults] = useState<ComparisonStudioResponse | null>(null);
  const [exportDeck, setExportDeck] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    runComparison();
  }, [peakQ, rainfallMm, scsCn]);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/multi-model/models');
      if (res.ok) {
        const data: ModelMetadata[] = await res.json();
        setModels(data);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };

  const runComparison = async () => {
    try {
      const res = await fetch('/api/multi-model/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peak_discharge_m3s: peakQ,
          rainfall_mm: rainfallMm,
          scs_cn: scsCn
        })
      });
      if (res.ok) {
        const data: ComparisonStudioResponse = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error('Comparison error:', err);
    }
  };

  const fetchExportDeck = async (modelId: string) => {
    try {
      const res = await fetch('/api/multi-model/export-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: modelId, peak_discharge_m3s: peakQ })
      });
      if (res.ok) {
        const data = await res.json();
        setExportDeck(data);
      }
    } catch (err) {
      console.error('Failed to fetch export deck:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                AI & Multi-Model Comparison Studio
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                  PHASE 9 INTEROPERABILITY
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Model Abstraction Framework: 2D Grid, SPH Particles, HEC-RAS/Delft3D Adapters, and DeepANN ML Surrogate
              </p>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <div className="text-xs text-slate-300">
            <div className="font-bold text-indigo-300 uppercase">COMPARISON DIRECTIVE</div>
            <div>Compares actual available results only. Adapters generate import/export decks.</div>
          </div>
        </div>
      </div>

      {/* Registered Solvers Grid Cards */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Registered Hydraulic Model Solvers & Adapters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {models.map((m) => (
            <div
              key={m.model_id}
              className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 font-mono">{m.model_type}</span>
                  {m.is_installed_and_tested ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> ADAPTER / DEMO
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-white mt-1.5">{m.model_name}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{m.model_notice}</div>
              </div>

              {!m.is_installed_and_tested && m.model_id.includes('model-') && !m.model_id.includes('ann') && (
                <button
                  onClick={() => fetchExportDeck(m.model_id)}
                  className="mt-3 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold py-1.5 px-3 rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Export Deck Config
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Control Sliders & Comparison Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sliders */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Comparison Scenario Inputs
          </h2>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Peak Discharge Q</span>
              <span className="text-indigo-400 font-mono">{peakQ.toLocaleString()} m³/s</span>
            </div>
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={peakQ}
              onChange={(e) => setPeakQ(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Basin Rainfall</span>
              <span className="text-cyan-400 font-mono">{rainfallMm} mm</span>
            </div>
            <input
              type="range"
              min="20"
              max="400"
              step="10"
              value={rainfallMm}
              onChange={(e) => setRainfallMm(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>SCS Curve Number</span>
              <span className="text-amber-400 font-mono">{scsCn}</span>
            </div>
            <input
              type="range"
              min="60"
              max="95"
              step="1"
              value={scsCn}
              onChange={(e) => setScsCn(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        {/* Side-by-side Table Comparison */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Side-by-Side Model Output Matrix (Q = {peakQ.toLocaleString()} m³/s)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                    <th className="p-3">Model Solver / Engine</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Peak Q</th>
                    <th className="p-3">Max Depth</th>
                    <th className="p-3">Max Velocity</th>
                    <th className="p-3">Inundation Area</th>
                    <th className="p-3">Peak Arrival</th>
                    <th className="p-3">Runtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                  {results?.comparison_matrix.map((item) => {
                    const m = item.metadata;
                    const out = item.outputs;
                    return (
                      <tr key={m.model_id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-sans font-medium text-white">
                          <div>{m.model_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{m.model_type}</div>
                        </td>

                        <td className="p-3 font-sans">
                          {m.is_installed_and_tested ? (
                            <span className="text-[10px] font-bold text-emerald-400">ACTIVE</span>
                          ) : item.training_status ? (
                            <span className="text-[10px] font-bold text-amber-400">ANN DEMO</span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500">ADAPTER</span>
                          )}
                        </td>

                        <td className="p-3 font-bold text-indigo-300">
                          {out ? `${out.peak_discharge_m3s.toLocaleString()} m³/s` : 'N/A'}
                        </td>

                        <td className="p-3 text-cyan-400 font-bold">
                          {out ? `${out.max_water_depth_m} m` : 'N/A'}
                        </td>

                        <td className="p-3 text-amber-400 font-bold">
                          {out ? `${out.max_velocity_ms} m/s` : 'N/A'}
                        </td>

                        <td className="p-3 text-purple-400 font-bold">
                          {out ? `${out.flood_inundation_area_km2} km²` : 'N/A'}
                        </td>

                        <td className="p-3 text-slate-300">
                          {out ? `${out.peak_arrival_time_hr} hrs` : 'N/A'}
                        </td>

                        <td className="p-3 text-slate-400">
                          {out ? `${out.execution_time_ms} ms` : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Deck Modal Box */}
          {exportDeck && (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-400" />
                  Generated Export Deck ({exportDeck.model_name})
                </div>
                <button
                  onClick={() => setExportDeck(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="text-xs text-amber-300 font-semibold">{exportDeck.notice}</div>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
                {JSON.stringify(exportDeck.export_deck, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
