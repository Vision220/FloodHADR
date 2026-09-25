import React from 'react';
import { useApp } from '../../context/AppContext';
import { Waves, ShieldAlert, Cpu, Activity, Sparkles, Loader2, Info, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeSimulation,
    isSimulating,
    selectedStudyArea,
    isDemoLoading,
    demoNotice,
    setDemoNotice,
    isDemoMode,
    startDemoMode,
    stopDemoMode,
    currentDemoStep,
    setShowFinalSummaryModal
  } = useApp();

  return (
    <>
      <header className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-md">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-sky-950">
            <Waves className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-lg tracking-tight text-white font-mono">FloodHADR</h1>
              <span className="text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-700/60 px-2 py-0.5 rounded tracking-wider uppercase">
                HADR Decision Support Platform
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium tracking-wide">
              Dam-Break & Flash-Flood Simulation Platform <span className="text-slate-500">| SIH 2026 (NTRO PS 26161)</span>
            </p>
          </div>
        </div>

        {/* Center Status / Active Region Indicator */}
        <div className="hidden lg:flex items-center space-x-4 bg-slate-800/90 border border-slate-700/70 rounded-lg px-3.5 py-1.5 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="text-slate-400 font-medium">Study Area:</span>
            <span className="font-semibold text-white">{selectedStudyArea.name ? selectedStudyArea.name.split('(')[0] : 'Tehri River Basin'}</span>
          </div>
          <div className="h-3 w-px bg-slate-700"></div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="text-slate-400 font-medium">Dam:</span>
            <span className="font-semibold text-sky-300">{selectedStudyArea.damName}</span>
          </div>
          <div className="h-3 w-px bg-slate-700"></div>
          <div className="flex items-center space-x-1.5 text-teal-400 font-medium">
            <Cpu className="w-3.5 h-3.5" />
            <span>2D Diffusive Wave Core</span>
          </div>
        </div>

        {/* Right Controls & [DEMO MODE] Button */}
        <div className="flex items-center space-x-3">
          
          {/* PROMINENT [DEMO MODE] ACTION BUTTON */}
          {isDemoMode ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFinalSummaryModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black px-3.5 py-1.5 rounded-lg text-xs shadow-lg animate-pulse"
                title="View Demonstration Summary Modal"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>[DEMO MODE: STEP {currentDemoStep}/8]</span>
              </button>

              <button
                onClick={stopDemoMode}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs border border-slate-700"
                title="Exit Demo Mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={startDemoMode}
              disabled={isDemoLoading || isSimulating}
              id="btn-demo-mode-navbar"
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 hover:from-amber-300 hover:to-emerald-400 text-slate-950 font-black px-4 py-1.5 rounded-lg text-xs shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
              title="Launch 8-step interactive guided presentation demonstration (~5 minutes)"
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Loading Demo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
                  <span>[DEMO MODE]</span>
                </>
              )}
            </button>
          )}

          {isSimulating ? (
            <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-lg text-xs font-semibold animate-pulse">
              <Activity className="w-4 h-4 animate-spin text-amber-400" />
              <span>Simulating... ({activeSimulation.progressPercent}%)</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-lg text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Hydro Core Online</span>
            </div>
          )}

          <div className="hidden md:flex items-center space-x-2 bg-red-950/60 text-red-300 border border-red-800/60 px-2.5 py-1 rounded-lg text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>HADR Defense Level 2</span>
          </div>
        </div>
      </header>

      {/* Synthetic Demo Data Notice Banner */}
      {demoNotice && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-6 py-2 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center space-x-2.5">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="tracking-tight">{demoNotice}</span>
          </div>
          <button
            onClick={() => setDemoNotice(null)}
            className="text-amber-400 hover:text-amber-100 font-bold ml-4 text-xs underline"
          >
            Dismiss Notice
          </button>
        </div>
      )}
    </>
  );
};
