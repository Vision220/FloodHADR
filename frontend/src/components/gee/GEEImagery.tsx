import React, { useState } from 'react';
import { Eye, Sliders, Layers, Calendar, Filter } from 'lucide-react';

interface GEEImageryProps {
  onSelectPreset?: (preset: string) => void;
}

export const GEEImagery: React.FC<GEEImageryProps> = ({ onSelectPreset }) => {
  const [preset, setPreset] = useState<string>('RGB');
  const [cloudCover, setCloudCover] = useState<number>(20);
  const [startDate, setStartDate] = useState<string>('2026-06-01');
  const [endDate, setEndDate] = useState<string>('2026-09-01');
  const [loading, setLoading] = useState(false);
  const [imageryResult, setImageryResult] = useState<any>(null);

  const handleFetchImagery = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/gee/imagery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          cloud_percentage: cloudCover,
          preset
        })
      });
      const data = await res.json();
      setImageryResult(data);
      if (onSelectPreset) onSelectPreset(preset);
    } catch {
      setImageryResult({
        status: 'SUCCESS',
        dataset: 'Sentinel-2 MSI Level-2A',
        preset,
        observation_period: `${startDate} to ${endDate}`,
        resolution: '10m Spatial Resolution',
        provenance: 'DEMO'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-xs font-mono space-y-3 select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-sky-400" />
          <h3 className="font-extrabold text-white text-sm uppercase tracking-wide">
            Sentinel-2 Optical Satellite Imagery
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] bg-sky-950 text-sky-300 border border-sky-800 font-bold">
          10M RESOLUTION
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Preset Selector */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center space-x-1">
            <Layers className="w-3 h-3 text-sky-400" />
            <span>Spectral Preset</span>
          </label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 focus:outline-none focus:border-sky-500"
          >
            <option value="RGB">Natural Color RGB (B4/B3/B2)</option>
            <option value="FalseColor">Infrared False Color (B8/B4/B3)</option>
            <option value="NDVI">NDVI Vegetation Index</option>
          </select>
        </div>

        {/* Cloud Threshold Slider */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
            <span className="flex items-center space-x-1">
              <Filter className="w-3 h-3 text-purple-400" />
              <span>Max Cloud Cover</span>
            </span>
            <span className="text-purple-400">{cloudCover}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={cloudCover}
            onChange={(e) => setCloudCover(Number(e.target.value))}
            className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded cursor-pointer mt-1"
          />
        </div>

        {/* Date Filter */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-emerald-400" />
            <span>Acquisition Date Range</span>
          </label>
          <div className="flex items-center space-x-1 text-[11px]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white p-1 rounded w-1/2 focus:outline-none"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white p-1 rounded w-1/2 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleFetchImagery}
        disabled={loading}
        className="w-full py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center space-x-2"
      >
        <Sliders className="w-3.5 h-3.5" />
        <span>{loading ? 'Querying GEE Data Catalog...' : 'Load Sentinel-2 Composite'}</span>
      </button>

      {imageryResult && (
        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>Dataset:</span>
            <span className="text-white font-bold">{imageryResult.dataset}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Spectral Preset:</span>
            <span className="text-sky-300 font-bold">{imageryResult.preset}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Spatial Resolution:</span>
            <span className="text-emerald-400 font-bold">{imageryResult.resolution}</span>
          </div>
          <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
            <span>Provenance Tag:</span>
            <span className="text-purple-300 font-bold font-mono">[{imageryResult.provenance}]</span>
          </div>
        </div>
      )}
    </div>
  );
};
