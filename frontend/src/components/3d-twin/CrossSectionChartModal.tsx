import React from 'react';
import type { CrossSectionPoint } from '../../types/digitalTwin3dTypes';
import { Activity, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CrossSectionChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  crossSectionData: CrossSectionPoint[];
  currentTimeMin: number;
}

export const CrossSectionChartModal: React.FC<CrossSectionChartModalProps> = ({
  isOpen,
  onClose,
  crossSectionData,
  currentTimeMin
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-4 font-sans text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-mono uppercase text-white tracking-wide">
                Hydraulic Cross-Section Profile Tool
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Transverse Reach Elevation Profile • Water Surface Elevation at T = {Math.round(currentTimeMin)} min
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cross Section Recharts Surface Area Chart */}
        <div className="h-72 bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={crossSectionData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="bedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#475569" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="distanceM"
                stroke="#64748b"
                fontSize={11}
                unit="m"
                label={{ value: 'Transverse Distance (m)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                unit="m"
                label={{ value: 'Elevation (m MSL)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`${Number(val).toFixed(1)} m`, name === 'waterSurfaceM' ? 'Water Surface' : 'River Bed Elevation']}
              />
              <Area type="monotone" dataKey="waterSurfaceM" stroke="#06b6d4" fill="url(#waterGrad)" strokeWidth={2} name="Water Surface (m MSL)" />
              <Area type="monotone" dataKey="bedElevationM" stroke="#64748b" fill="url(#bedGrad)" strokeWidth={2} name="River Bed (m MSL)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Hydraulic Summary Footer */}
        <div className="grid grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400">Max Water Surface</span>
            <div className="text-sm font-bold text-cyan-300 mt-0.5">
              {Math.max(...crossSectionData.map(d => d.waterSurfaceM)).toFixed(1)} m MSL
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400">Max Channel Depth</span>
            <div className="text-sm font-bold text-white mt-0.5">
              {Math.max(...crossSectionData.map(d => d.waterDepthM)).toFixed(1)} m
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400">Top Inundation Width</span>
            <div className="text-sm font-bold text-amber-300 mt-0.5">
              {crossSectionData.filter(d => d.waterDepthM > 0.1).length * 20} m
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400">Scientific Source</span>
            <div className="text-[11px] font-bold text-emerald-400 mt-0.5 uppercase">
              SOURCE: SIMULATED 2D
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
