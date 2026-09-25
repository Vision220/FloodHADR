import React from 'react';
import type { HydroSimulationState, ScenarioParams } from '../../types/3dTypes';
import { Play, Pause, RotateCcw, Clock, Sparkles } from 'lucide-react';

interface TimelineScrubberProps {
  simState: HydroSimulationState;
  params: ScenarioParams;
  onScrub: (timeMin: number) => void;
  onTogglePlay: () => void;
  onReset: () => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  simState,
  params,
  onScrub,
  onTogglePlay,
  onReset
}) => {
  const isPlaying = simState.status === 'Simulating';
  const duration = params.simulationDurationMin;

  return (
    <div className="w-full bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-6 py-3 text-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 select-none shadow-2xl">
      
      {/* Play/Pause & Reset Controls */}
      <div className="flex items-center space-x-3 shrink-0">
        <button
          onClick={onTogglePlay}
          className={`px-4 py-2 rounded-xl text-xs font-black text-slate-950 flex items-center space-x-2 shadow-lg transition-all ${
            isPlaying ? 'bg-amber-400 hover:bg-amber-300' : 'bg-emerald-400 hover:bg-emerald-300'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY</span>
            </>
          )}
        </button>

        <button
          onClick={onReset}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
          title="Restart Simulation Timeline"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex flex-col text-xs font-mono">
          <div className="flex items-center space-x-1.5 font-bold text-white">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Time: {simState.currentTimeMin.toFixed(1)} / {duration} min</span>
          </div>
          <span className="text-[10px] text-slate-400">{simState.stageName}</span>
        </div>
      </div>

      {/* Center Timeline Range Scrubber */}
      <div className="flex-1 w-full space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold px-1">
          <span>00:00 (Intact)</span>
          <span>15:00 (Breach)</span>
          <span>30:00 (Jet Discharge)</span>
          <span>60:00 (Peak Surge)</span>
          <span>90:00 (Inundation)</span>
          <span>120:00 (Max Envelope)</span>
        </div>

        <input
          type="range"
          min="0"
          max={duration}
          step="0.5"
          value={simState.currentTimeMin}
          onChange={(e) => onScrub(parseFloat(e.target.value))}
          className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
        />
      </div>

      {/* Right Stage Indicator Badge */}
      <div className="hidden lg:flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono shrink-0">
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        <div>
          <div className="text-[9px] text-slate-400 font-semibold uppercase">Wave Front Distance</div>
          <div className="font-extrabold text-amber-300">+{simState.waterFrontDistanceM} m downstream</div>
        </div>
      </div>

    </div>
  );
};
