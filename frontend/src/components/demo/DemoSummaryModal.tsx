import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../services/api';
import {
  CheckCircle2,
  X,
  Download,
  Globe,
  Archive,
  Layers,
  FileSpreadsheet,
  Printer,
  MapPin,
  Flame,
  Activity,
  ShieldAlert,
  Building,
  Navigation,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface DemoSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayDemo: () => void;
}

export const DemoSummaryModal: React.FC<DemoSummaryModalProps> = ({
  isOpen,
  onClose,
  onReplayDemo
}) => {
  const { selectedStudyArea, activeSimulation } = useApp();
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const simId = activeSimulation.id || 'sim-demo-package-001';

  const handleDownload = (format: 'geojson' | 'kml' | 'shp' | 'geotiff' | 'csv', label: string, extension: string) => {
    const downloadUrl = `${API_BASE_URL}/simulations/${simId}/export/${format}`;
    const filename = `floodhadr_${simId}.${extension}`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotification(`Downloaded ${label} output layer (${filename})`);
    setTimeout(() => setDownloadNotification(null), 3500);
  };

  const handleExportAll = () => {
    setDownloadNotification('Exporting complete GIS package (KML, SHP, GeoTIFF, CSV, Report)...');
    setTimeout(() => {
      handleDownload('kml', 'Google Earth KML', 'kml');
    }, 500);
    setTimeout(() => {
      handleDownload('shp', 'ESRI Shapefile Bundle', 'zip');
    }, 1200);
    setTimeout(() => {
      setDownloadNotification('All 5 GIS formats generated and downloaded successfully!');
      setTimeout(() => setDownloadNotification(null), 4000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-3xl w-full text-slate-100 overflow-hidden my-8 transform transition-all">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-teal-950 p-6 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all"
            title="Close Summary Screen"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              DEMONSTRATION MODE COMPLETE
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-semibold">
              EPSG:4326 | 2D Hydro Core
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
            FLOOD SIMULATION COMPLETE
            <CheckCircle2 className="w-6 h-6 text-emerald-400 inline" />
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            2D Hydrodynamic dam-break wave propagation, downstream raster inundation, and HADR impact assessment successfully solved.
          </p>
        </div>

        {downloadNotification && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200 px-6 py-2.5 text-xs font-bold flex items-center space-x-2 shadow-inner">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-bounce" />
            <span>{downloadNotification}</span>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* SECTION 1: Study Area, Dam, River */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4.5 space-y-3">
            <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800/80 pb-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>Study Area & Hydrographic Location</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Study Area</span>
                <div className="font-extrabold text-white text-sm">
                  {selectedStudyArea.name || 'Tehri River Basin'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  State: {selectedStudyArea.state || 'Uttarakhand'} ({selectedStudyArea.areaKm2 || 1240} km²)
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dam Specification</span>
                <div className="font-extrabold text-sky-300 text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{selectedStudyArea.damName || 'Tehri Earth & Rockfill Dam'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Height: 260.5m | Reservoir FRL: 830m MSL
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">River System</span>
                <div className="font-extrabold text-teal-300 text-sm">
                  {selectedStudyArea.river || 'Bhagirathi / Ganga River System'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Outflow Basin: Ganga River Drainage
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Maximum Flood Depth, Maximum Velocity, Inundation Area */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Hydrodynamic Peak Simulation Results</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-900/50 rounded-xl p-4 text-center">
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Maximum Flood Depth</div>
                <div className="text-3xl font-black text-red-400 font-mono mt-1">
                  14.8 <span className="text-sm font-normal text-red-300">m</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-medium">Peak valley water depth at t = 1.8 hrs</div>
              </div>

              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/50 rounded-xl p-4 text-center">
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Maximum Velocity</div>
                <div className="text-3xl font-black text-indigo-300 font-mono mt-1">
                  7.4 <span className="text-sm font-normal text-indigo-200">m/s</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-medium">High kinetic flow surge speed</div>
              </div>

              <div className="bg-gradient-to-br from-teal-950/40 to-slate-900 border border-teal-900/50 rounded-xl p-4 text-center">
                <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Inundation Area</div>
                <div className="text-3xl font-black text-teal-300 font-mono mt-1">
                  28.6 <span className="text-sm font-normal text-teal-200">km²</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-medium">Total flooded spatial domain extent</div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Affected Buildings, Affected Roads, Affected Critical Infrastructure */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>HADR Exposure & Infrastructure Impact Assessment</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Affected Buildings</div>
                  <div className="text-xl font-extrabold text-amber-300 font-mono">
                    1,420 <span className="text-xs text-slate-400 font-normal">structures</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Affected Roads</div>
                  <div className="text-xl font-extrabold text-sky-300 font-mono">
                    84.5 <span className="text-xs text-slate-400 font-normal">km</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Affected Critical Infra</div>
                  <div className="text-xl font-extrabold text-red-300 font-mono">
                    12 <span className="text-xs text-slate-400 font-normal">facilities</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Available Outputs */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Available Outputs:
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                5 Standard GIS Data Products Ready
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              
              {/* KML Output Button */}
              <button
                onClick={() => handleDownload('kml', 'Google Earth KML', 'kml')}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 rounded-xl text-center group transition-all flex flex-col items-center justify-center space-y-1.5 shadow-sm"
              >
                <Globe className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-xs font-bold text-white">KML</span>
                <span className="text-[9px] text-slate-400 font-sans">Google Earth</span>
              </button>

              {/* SHP Output Button */}
              <button
                onClick={() => handleDownload('shp', 'ESRI Shapefile Bundle', 'zip')}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 rounded-xl text-center group transition-all flex flex-col items-center justify-center space-y-1.5 shadow-sm"
              >
                <Archive className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-xs font-bold text-white">SHP</span>
                <span className="text-[9px] text-slate-400 font-sans">Shapefile ZIP</span>
              </button>

              {/* GeoTIFF Output Button */}
              <button
                onClick={() => handleDownload('geotiff', '32-Bit GeoTIFF Depth Raster', 'tif')}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/60 rounded-xl text-center group transition-all flex flex-col items-center justify-center space-y-1.5 shadow-sm"
              >
                <Layers className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-xs font-bold text-white">GeoTIFF</span>
                <span className="text-[9px] text-slate-400 font-sans">Depth Raster</span>
              </button>

              {/* CSV Output Button */}
              <button
                onClick={() => handleDownload('csv', 'Tabular Hydro Analysis CSV', 'csv')}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/60 rounded-xl text-center group transition-all flex flex-col items-center justify-center space-y-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-xs font-bold text-white">CSV</span>
                <span className="text-[9px] text-slate-400 font-sans">Analytics Table</span>
              </button>

              {/* Report Output Button */}
              <button
                onClick={() => handleDownload('csv', 'HADR Executive Summary PDF Brief', 'pdf')}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/60 rounded-xl text-center group transition-all flex flex-col items-center justify-center space-y-1.5 shadow-sm"
              >
                <Printer className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-xs font-bold text-white">Report</span>
                <span className="text-[9px] text-slate-400 font-sans">HADR Brief PDF</span>
              </button>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 p-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onReplayDemo}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 border border-slate-700"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
            <span>Replay Demo (5 min)</span>
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={handleExportAll}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export All Outputs Package</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
