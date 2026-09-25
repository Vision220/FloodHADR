import React from 'react';
import { useApp } from '../context/AppContext';
import { ElevationProfileChart } from '../components/analytics/ElevationProfileChart';
import { Database, Save, ArrowRight } from 'lucide-react';

export const DataInputPage: React.FC = () => {
  const { selectedDam, setSelectedDam, setActivePage } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
            <Database className="w-4 h-4 text-sky-600" />
            <span>Hydrological & Dam Engineering Inputs</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Dam Parameters & Reservoir Storage Curves
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure dam structural dimensions, spillway ratings, Manning roughness coefficients, and water levels.
          </p>
        </div>

        <button
          onClick={() => setActivePage('dam-break')}
          className="mt-4 md:mt-0 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center space-x-1.5"
        >
          <span>Configure Dam Break Scenario</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Dam Engineering Specification Form
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                {selectedDam.name}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dam Name</label>
                <input
                  type="text"
                  value={selectedDam.name}
                  onChange={(e) => setSelectedDam({ ...selectedDam, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">River Basin Name</label>
                <input
                  type="text"
                  value={selectedDam.river}
                  onChange={(e) => setSelectedDam({ ...selectedDam, river: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dam Crest Height (m)</label>
                <input
                  type="number"
                  value={selectedDam.heightM}
                  onChange={(e) => setSelectedDam({ ...selectedDam, heightM: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Crest Length (m)</label>
                <input
                  type="number"
                  value={selectedDam.crestLengthM}
                  onChange={(e) => setSelectedDam({ ...selectedDam, crestLengthM: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reservoir Storage Capacity (Million m³)</label>
                <input
                  type="number"
                  value={selectedDam.reservoirVolumeMm3}
                  onChange={(e) => setSelectedDam({ ...selectedDam, reservoirVolumeMm3: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Reservoir Level (m MSL)</label>
                <input
                  type="number"
                  value={selectedDam.fullReservoirLevelM}
                  onChange={(e) => setSelectedDam({ ...selectedDam, fullReservoirLevelM: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Current Water Level (m MSL)</label>
                <input
                  type="number"
                  value={selectedDam.currentWaterLevelM}
                  onChange={(e) => setSelectedDam({ ...selectedDam, currentWaterLevelM: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Spillway Capacity (m³/s)</label>
                <input
                  type="number"
                  value={selectedDam.spillwayCapacityM3s}
                  onChange={(e) => setSelectedDam({ ...selectedDam, spillwayCapacityM3s: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs flex items-center space-x-1.5 shadow">
                <Save className="w-3.5 h-3.5" />
                <span>Save Hydrological Inputs</span>
              </button>
            </div>
          </div>

          <ElevationProfileChart />
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Land Cover Manning's Roughness (n)
            </h3>
            <p className="text-[11px] text-slate-500">
              Calibrated hydraulic roughness parameters for 2D flow resistance
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                <span className="font-semibold text-slate-700">Main River Channel</span>
                <span className="font-mono font-bold text-sky-700">n = 0.030</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                <span className="font-semibold text-slate-700">Floodplain / Agriculture</span>
                <span className="font-mono font-bold text-sky-700">n = 0.045</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                <span className="font-semibold text-slate-700">Dense Forest / Gorge</span>
                <span className="font-mono font-bold text-sky-700">n = 0.080</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                <span className="font-semibold text-slate-700">Urban Built-up Area</span>
                <span className="font-mono font-bold text-sky-700">n = 0.120</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Dam Classification
            </h3>
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-sky-900">Primary Material: {selectedDam.damType}</div>
              <div className="text-slate-600">Year Built: {selectedDam.constructionYear}</div>
              <div className="text-slate-600">Structural Vulnerability Index: Moderate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
