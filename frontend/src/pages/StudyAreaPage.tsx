import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { mockStudyAreas } from '../data/mockData';
import { GISMapModule } from '../components/map/GISMapModule';
import { apiService } from '../services/api';
import type { DEMMetadata } from '../types';
import { MapPin, Upload, CheckCircle2, ArrowRight, AlertTriangle, RefreshCw, BarChart2, Layers } from 'lucide-react';

export const StudyAreaPage: React.FC = () => {
  const { selectedStudyArea, setSelectedStudyArea, setActivePage } = useApp();
  const [demMetadata, setDemMetadata] = useState<DEMMetadata | null>(null);
  const [activeDemId, setActiveDemId] = useState<string>('dem-tehri-default');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Fetch initial default DEM metadata on mount
  useEffect(() => {
    apiService.getDEMMetadata(activeDemId)
      .then((meta) => setDemMetadata(meta))
      .catch((err) => console.log('Using default state:', err));
  }, [activeDemId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await apiService.uploadDEM(file);
      setDemMetadata(res.metadata);
      setActiveDemId(res.metadata.id);
      setUploadSuccess(`DEM "${file.name}" uploaded, validated & simulation grid generated!`);
    } catch (err: any) {
      setUploadError(err.message || 'Invalid raster file format. Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4 text-sky-600" />
            <span>Region & Terrain Specification</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Study Area Management & DEM Raster Module
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload, validate, inspect spatial CRS, elevation statistics, and convert DEM GeoTIFF into hydrodynamic simulation grids.
          </p>
        </div>

        <button
          onClick={() => setActivePage('data')}
          className="mt-4 md:mt-0 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center space-x-1.5"
        >
          <span>Configure Dam & Hydrology Data</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          {/* Preset Selection */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Preset River Basin
            </h3>

            <div className="space-y-2.5">
              {mockStudyAreas.map((area) => (
                <div
                  key={area.id}
                  onClick={() => setSelectedStudyArea(area)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedStudyArea.id === area.id
                      ? 'border-sky-600 bg-sky-50/80 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs">{area.name}</span>
                    {selectedStudyArea.id === area.id && (
                      <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div><strong>River:</strong> {area.river}</div>
                    <div><strong>Dam:</strong> {area.damName} ({area.state})</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-semibold rounded">
                        {area.demResolution}
                      </span>
                      <span className="text-slate-500 text-[10px]">Area: {area.areaKm2} km²</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload DEM GeoTIFF Module */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Upload Custom DEM GeoTIFF</span>
              <Layers className="w-4 h-4 text-sky-600" />
            </h3>

            <label className="block border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-lg p-5 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-sky-50/30">
              <input
                type="file"
                accept=".tif,.tiff,.geotiff"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="py-2 flex flex-col items-center space-y-2">
                  <RefreshCw className="w-7 h-7 text-sky-600 animate-spin" />
                  <div className="text-xs font-bold text-sky-900">Validating & Reading GeoTIFF...</div>
                  <p className="text-[10px] text-slate-500">Extracting elevation matrix & calculating stats</p>
                </div>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-sky-600 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-800">
                    Click to browse or drop DEM GeoTIFF raster (.tif)
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Supports ALOS PALSAR, SRTM 30m, Cartosat GeoTIFF rasters
                  </p>
                </>
              )}
            </label>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Raster Validation Failed</div>
                  <div className="text-[11px] text-red-600">{uploadError}</div>
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="font-semibold text-[11px]">{uploadSuccess}</div>
              </div>
            )}
          </div>

          {/* Active DEM Metadata Card */}
          {demMetadata && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active DEM Raster Specs
                </h3>
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded">
                  {demMetadata.id}
                </span>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">DEM Name:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[150px]">{demMetadata.filename}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">CRS Spatial Reference:</span>
                  <span className="font-mono font-bold text-sky-700">{demMetadata.crs}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">Spatial Resolution:</span>
                  <span className="font-bold text-slate-900">{demMetadata.resolution}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">Width × Height:</span>
                  <span className="font-mono font-bold text-slate-900">{demMetadata.width} × {demMetadata.height} px</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">Minimum Elevation:</span>
                  <span className="font-bold text-emerald-700">{demMetadata.min_elevation.toFixed(1)} m MSL</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">Maximum Elevation:</span>
                  <span className="font-bold text-red-600">{demMetadata.max_elevation.toFixed(1)} m MSL</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">Mean Elevation:</span>
                  <span className="font-bold text-slate-900">{demMetadata.mean_elevation.toFixed(1)} m MSL</span>
                </div>
              </div>

              {/* Simulation Grid Parameters Summary */}
              {demMetadata.sim_grid_summary && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Generated Simulation Grid:</span>
                    <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                    <div>Grid Size: <strong>{demMetadata.sim_grid_summary.rows}×{demMetadata.sim_grid_summary.cols}</strong></div>
                    <div>Cell Size: <strong>~{demMetadata.sim_grid_summary.cell_size_m}m</strong></div>
                    <div className="col-span-2">Total Cells: <strong>{demMetadata.sim_grid_summary.total_cells.toLocaleString()} cells</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 shadow-subtle flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Region of Interest Map & DEM Preview
              </h3>
              <p className="text-[11px] text-slate-500">
                Displaying interactive GIS layers & downsampled DEM elevation heatmap overlay
              </p>
            </div>
            {demMetadata && (
              <div className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                Range: {demMetadata.min_elevation.toFixed(0)}m - {demMetadata.max_elevation.toFixed(0)}m MSL
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[500px]">
            <GISMapModule height="100%" showControls={true} activeDemId={activeDemId} />
          </div>
        </div>
      </div>
    </div>
  );
};
