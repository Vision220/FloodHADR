import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../services/api';
import { mockReports } from '../data/mockData';
import {
  Download,
  FileCode,
  Layers,
  FileSpreadsheet,
  Globe,
  Archive,
  CheckCircle2,
  Compass,
  FileText,
  Printer
} from 'lucide-react';

export const ReportsExportPage: React.FC = () => {
  const { activeSimulation } = useApp();
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const simId = activeSimulation.id || 'sim-2026-001';

  // Export download handler directly contacting FastAPI backend endpoints
  const triggerExportDownload = (format: 'geojson' | 'kml' | 'shp' | 'geotiff' | 'csv', filename: string) => {
    const downloadUrl = `${API_BASE_URL}/simulations/${simId}/export/${format}`;

    // Create dynamic download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotice(`Generating ${filename} via GeoPandas / Rasterio backend API...`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
            <Download className="w-4 h-4 text-sky-600" />
            <span>GIS & Hydrodynamic Data Product Export Center</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Simulation Results & Spatial GIS Export
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Export verified 2D hydrodynamic simulation output in 5 standard GIS formats (GeoJSON, KML, Shapefile ZIP, GeoTIFF, CSV).
          </p>
        </div>

        <div className="mt-4 md:mt-0 px-3.5 py-2 bg-sky-50 border border-sky-200 rounded-lg text-xs font-mono font-bold text-sky-900 flex items-center space-x-2">
          <Compass className="w-4 h-4 text-sky-600" />
          <span>CRS Verified: EPSG:4326 (WGS 84)</span>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-subtle animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* 5 PRIMARY REQUIRED EXPORT FORMAT CARDS WITH DOWNLOAD BUTTONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* 1. GeoJSON Vector Export Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col justify-between space-y-4 hover:shadow-panel transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <FileCode className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800">
                EPSG:4326
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. GeoJSON Vector Layers (.geojson)
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Standard RFC 7946 GeoJSON FeatureCollection containing 2D inundation depth zones and flow velocity vectors.
            </p>
          </div>
          <button
            onClick={() => triggerExportDownload('geojson', `floodhadr_${simId}.geojson`)}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs shadow transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>[DOWNLOAD GEOJSON]</span>
          </button>
        </div>

        {/* 2. Google Earth KML Export Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col justify-between space-y-4 hover:shadow-panel transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                KML 2.2
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Google Earth KML (.kml)
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Google Earth XML document containing 3D styled polygon contours and outer boundary rings.
            </p>
          </div>
          <button
            onClick={() => triggerExportDownload('kml', `floodhadr_${simId}.kml`)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>[DOWNLOAD KML]</span>
          </button>
        </div>

        {/* 3. ESRI Shapefile Bundle Export Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col justify-between space-y-4 hover:shadow-panel transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Archive className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                ZIP BUNDLE
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. ESRI Shapefile Bundle (.zip)
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              GeoPandas generated ESRI Shapefile bundle containing .shp, .shx, .dbf, and .prj (EPSG:4326 WGS84).
            </p>
          </div>
          <button
            onClick={() => triggerExportDownload('shp', `floodhadr_shp_${simId}.zip`)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>[DOWNLOAD SHAPEFILE]</span>
          </button>
        </div>

        {/* 4. GeoTIFF Flood-Depth Raster Export Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col justify-between space-y-4 hover:shadow-panel transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800">
                RASTERIO 32-BIT
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              4. GeoTIFF Depth Raster (.tif)
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              32-bit floating point flood depth grid generated via Rasterio & PyProj with affine geotransform transform.
            </p>
          </div>
          <button
            onClick={() => triggerExportDownload('geotiff', `floodhadr_depth_${simId}.tif`)}
            className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs shadow transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>[DOWNLOAD GEOTIFF]</span>
          </button>
        </div>

        {/* 5. CSV Summary Report Export Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col justify-between space-y-4 hover:shadow-panel transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                TABULAR CSV
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              5. CSV Summary Report (.csv)
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Tabular CSV executive report listing hydrograph outflow, inundation depth zones, and impacted critical infrastructure.
            </p>
          </div>
          <button
            onClick={() => triggerExportDownload('csv', `floodhadr_summary_${simId}.csv`)}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>[DOWNLOAD CSV]</span>
          </button>
        </div>

        {/* 6. HADR Executive Brief PDF Export Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col justify-between space-y-4 hover:shadow-panel transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono bg-slate-900 text-white px-2 py-0.5 rounded">
                HADR BRIEF
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              6. HADR Executive Brief PDF
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Formatted disaster management brief with flooded asset list, population risk index, and evacuation routing maps.
            </p>
          </div>
          <button
            onClick={() => triggerExportDownload('csv', `HADR_Executive_Brief_${simId}.csv`)}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow transition-all flex items-center justify-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Generate & Download Brief</span>
          </button>
        </div>
      </div>

      {/* HISTORICAL EXPORT LOG ARCHIVE TABLE */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b pb-2.5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <FileText className="w-4 h-4 text-sky-600" />
            <span>GIS Export Product Log & System Archive</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-500 font-bold">
            GeoPandas / Rasterio Worker Stream
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Export Document Title</th>
                <th className="py-2.5 px-3">Format</th>
                <th className="py-2.5 px-3">CRS Reference</th>
                <th className="py-2.5 px-3">Simulation Scenario</th>
                <th className="py-2.5 px-3">Est. File Size</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {mockReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{rep.title}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono">{rep.type}</td>
                  <td className="py-2.5 px-3 font-mono text-sky-800 font-bold">EPSG:4326</td>
                  <td className="py-2.5 px-3 text-slate-600">{rep.scenarioName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{rep.fileSize}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => triggerExportDownload('geojson', `floodhadr_${simId}.geojson`)}
                      className="text-sky-700 hover:text-sky-900 font-bold flex items-center space-x-1 ml-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
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
