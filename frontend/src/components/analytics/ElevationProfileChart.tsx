import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockElevationProfile } from '../../data/mockData';

export const ElevationProfileChart: React.FC = () => {
  return (
    <div className="w-full h-64 bg-white border border-slate-200 rounded-lg p-4 shadow-subtle flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Dam-to-Valley Elevation & Water Surface Profile
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Longitudinal DEM terrain cross-section vs. flood depth profile
          </p>
        </div>
        <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-300">
          Reach Length: 40 km
        </span>
      </div>

      <div className="flex-1 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockElevationProfile} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#475569" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#475569" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="waterSurfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="distanceKm" label={{ value: 'Downstream Distance (km)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }} tick={{ fontSize: 10 }} />
            <YAxis label={{ value: 'Elevation (m MSL)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 10, fill: '#475569' }} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '6px', fontSize: '11px' }} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
            <Area type="monotone" dataKey="waterElevationM" name="Water Surface Elevation (m)" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#waterSurfGrad)" />
            <Area type="monotone" dataKey="groundElevationM" name="DEM Ground Elevation (m)" stroke="#334155" strokeWidth={2} fillOpacity={1} fill="url(#groundGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
