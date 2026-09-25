import React, { useState, useEffect } from 'react';
import { Globe, AlertTriangle, ShieldCheck, Database, Loader2 } from 'lucide-react';

interface GEEStatusInfo {
  enabled: boolean;
  authenticated: boolean;
  project: string;
  service: string;
  message: string;
  mode: string;
}

export const GEEStatus: React.FC = () => {
  const [status, setStatus] = useState<GEEStatusInfo>({
    enabled: true,
    authenticated: false,
    project: 'Initializing...',
    service: 'Google Earth Engine Data Catalog',
    message: 'Checking server authentication...',
    mode: 'DEMO_DATA_MODE'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/gee/status')
      .then((res) => res.json())
      .then((data) => {
        if (data) setStatus(data);
      })
      .catch(() => {
        setStatus((prev) => ({
          ...prev,
          message: 'GEE Offline — DEMO DATA MODE Active (High-res ESRI / CHIRPS / Sentinel-1 Benchmark active)',
          mode: 'DEMO_DATA_MODE'
        }));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-xs font-mono select-none space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wide">
                Google Earth Engine Status
              </h3>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
            </div>
            <p className="text-[10px] text-slate-400">
              Remote Sensing & Environmental Intelligence Engine
            </p>
          </div>
        </div>

        {/* Dynamic Connection Indicator */}
        <div className="flex items-center space-x-2">
          {status.authenticated ? (
            <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center space-x-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>● Connected</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center space-x-1.5 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>○ Not Configured (Demo Mode)</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">GCP Project ID</span>
          <div className="text-xs font-bold text-sky-400 truncate">{status.project}</div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Engine Service</span>
          <div className="text-xs font-bold text-purple-300 truncate">{status.service}</div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Execution Mode</span>
          <div className="text-xs font-bold text-teal-300 flex items-center space-x-1">
            <Database className="w-3 h-3 text-teal-400" />
            <span>{status.mode}</span>
          </div>
        </div>
      </div>

      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed flex items-start space-x-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <span>{status.message}</span>
      </div>
    </div>
  );
};
