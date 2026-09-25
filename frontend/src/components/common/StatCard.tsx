import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  unit?: string;
  icon: LucideIcon;
  accentColor?: 'blue' | 'teal' | 'amber' | 'red' | 'navy' | 'emerald';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  unit,
  icon: Icon,
  accentColor = 'blue',
  badge,
}) => {
  const accentStyles = {
    blue: 'border-l-sky-600 text-sky-600 bg-sky-50',
    teal: 'border-l-teal-600 text-teal-600 bg-teal-50',
    amber: 'border-l-amber-500 text-amber-600 bg-amber-50',
    red: 'border-l-red-600 text-red-600 bg-red-50',
    navy: 'border-l-slate-800 text-slate-800 bg-slate-100',
    emerald: 'border-l-emerald-600 text-emerald-600 bg-emerald-50',
  };

  const iconStyles = {
    blue: 'bg-sky-100 text-sky-700',
    teal: 'bg-teal-100 text-teal-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    navy: 'bg-slate-200 text-slate-800',
    emerald: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className={`bg-white border border-slate-200 border-l-4 ${accentStyles[accentColor].split(' ')[0]} rounded-lg p-4 shadow-subtle hover:shadow-card transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">
              {value}
            </span>
            {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate max-w-[180px]">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconStyles[accentColor]} flex-shrink-0`}>
          <Icon className="w-5 h-5 stroke-[2]" />
        </div>
      </div>
      {badge && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
          <span className="font-semibold text-slate-500">Status</span>
          <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
};
