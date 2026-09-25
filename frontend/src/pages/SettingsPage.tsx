import React from 'react';
import { Settings, Cpu, Database, Globe, Sliders, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4 text-sky-600" />
            <span>Platform Configuration</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            System & Engine Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure hydrodynamic numerical parameters, CRS spatial frames, database endpoints, and external HPC adapters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
          <div className="flex items-center space-x-2 border-b pb-2 text-slate-800 font-bold uppercase tracking-wider">
            <Globe className="w-4 h-4 text-sky-600" />
            <span>Spatial Reference & CRS Settings</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Geographic CRS</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded font-medium text-slate-800 bg-white">
                <option value="EPSG:4326">EPSG:4326 - WGS 84 Geographic (Latitude / Longitude)</option>
                <option value="EPSG:32644">EPSG:32644 - WGS 84 / UTM Zone 44N (Northern India / Himalayas)</option>
                <option value="EPSG:32645">EPSG:32645 - WGS 84 / UTM Zone 45N (Eastern Plains)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 border rounded text-slate-600 space-y-1">
              <div><strong>DEM Reprojection Engine:</strong> PyProj & Rasterio GeoTIFF Transformer</div>
              <div><strong>Resampling Algorithm:</strong> Bilinear Interpolation</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
          <div className="flex items-center space-x-2 border-b pb-2 text-slate-800 font-bold uppercase tracking-wider">
            <Database className="w-4 h-4 text-teal-600" />
            <span>Database & ORM Architecture</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>SQLite Async Storage Engine Active</span>
              </div>
              <div className="text-[11px] text-emerald-700">
                SQLAlchemy 2.0 Async ORM initialized for local prototype zero-dependency execution.
              </div>
            </div>

            <div className="p-3 bg-slate-50 border rounded text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">PostgreSQL / PostGIS Migration Ready</div>
              <div className="text-[11px]">
                Target connection string: <code>postgresql+asyncpg://user:pass@localhost:5432/floodhadr</code>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
          <div className="flex items-center space-x-2 border-b pb-2 text-slate-800 font-bold uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Numerical Stability & CFL Rules</span>
          </div>

          <div className="space-y-2 text-slate-700">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Maximum CFL Limit C_max:</span>
              <span className="font-mono font-bold">0.85</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Minimum Inundation Depth Threshold:</span>
              <span className="font-mono font-bold">0.05 m (5 cm)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Adaptive Time Stepping:</span>
              <span className="font-semibold text-emerald-700">Enabled</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
          <div className="flex items-center space-x-2 border-b pb-2 text-slate-800 font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-sky-600" />
            <span>External Engine HPC Endpoints</span>
          </div>

          <div className="space-y-2 text-slate-700">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Delft3D Engine Endpoint:</span>
              <span className="font-mono text-slate-600">localhost:9090 (Adapter Standby)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>DualSPHysics SPH Endpoint:</span>
              <span className="font-mono text-slate-600">localhost:9091 (Adapter Standby)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
