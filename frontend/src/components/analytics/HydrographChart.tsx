import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockHydrographData } from '../../data/mockData';

export const HydrographChart: React.FC = () => {
  return (
    <div className="w-full h-64 bg-white border border-slate-200 rounded-lg p-4 shadow-subtle flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Breach Outflow Hydrograph (Discharge Q vs. Time)
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Froehlich (2008) Dam Breach Hydrograph Solver Output
          </p>
        </div>
        <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded border border-sky-300">
          Peak Flow Qₚ: 64,200 m³/s
        </span>
      </div>

      <div className="flex-1 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockHydrographData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="dischargeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="depthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="timeHr" label={{ value: 'Time (Hours post breach)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }} tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" label={{ value: 'Discharge (m³/s)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 10, fill: '#0369a1' }} tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Depth (m)', angle: 90, position: 'insideRight', offset: 15, fontSize: 10, fill: '#b91c1c' }} tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '6px', fontSize: '11px' }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
            <Area yAxisId="left" type="monotone" dataKey="discharge" name="Discharge Q (m³/s)" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#dischargeGrad)" />
            <Area yAxisId="right" type="monotone" dataKey="depthM" name="Water Depth (m)" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#depthGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
