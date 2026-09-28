import React, { useState } from 'react';
import type { HydroSimulationState, ScenarioParams } from '../../types/3dTypes';
import { Play, Pause, RotateCcw, Clock, Sparkles, SkipBack, SkipForward, FastForward, AlertCircle } from 'lucide-react';

interface TimelineScrubberProps {
  simState: HydroSimulationState;
  params: ScenarioParams;
  onScrub: (timeMin: number) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onPreviousStep?: () => void;
  onNextStep?: () => void;
  onSpeedChange?: (speed: number) => void;
  hasTemporalData?: boolean;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  simState,
  params,
  onScrub,
  onTogglePlay,
  onReset,
  onPreviousStep,
  onNextStep,
  onSpeedChange,
  hasTemporalData = true,
}) => {
  const isPlaying = simState.status === 'Simulating';
  const durationMin = params.simulationDurationMin || 360;
  const durationHr = (durationMin / 60.0).toFixed(1);
  const currentTimeHr = (simState.currentTimeMin / 60.0).toFixed(1);

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const handleSpeedSelect = (s: number) => {
    setPlaybackSpeed(s);
    if (onSpeedChange) onSpeedChange(s);
  };

  const totalSteps = 72;
  const currentStep = Math.min(totalSteps, Math.max(1, Math.round((simState.currentTimeMin / durationMin) * totalSteps)));

  if (!hasTemporalData) {
    return (
      <div className="w-full bg-slate-900/95 border-t border-red-800/80 backdrop-blur-md px-6 py-3 text-slate-100 flex items-center justify-between text-xs font-mono shadow-2xl">
        <div className="flex items-center space-x-2 text-red-400 font-bold">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>ANIMATION DISABLED — NO TEMPORAL RESULT AVAILABLE</span>
        </div>
        <span className="text-[11px] text-slate-400">
          Run simulation or import a valid temporal result package to enable frame playback.
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-6 py-3 text-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 select-none shadow-2xl">
      
      {/* Play/Pause & Step Controls */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Previous Step Button */}
        <button
          onClick={onPreviousStep || (() => onScrub(Math.max(0, simState.currentTimeMin - 5)))}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all cursor-pointer"
          title="Previous Simulation Frame"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className={`px-4 py-2 rounded-xl text-xs font-black text-slate-950 flex items-center space-x-2 shadow-lg transition-all cursor-pointer ${
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

        {/* Next Step Button */}
        <button
          onClick={onNextStep || (() => onScrub(Math.min(durationMin, simState.currentTimeMin + 5)))}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all cursor-pointer"
          title="Next Simulation Frame"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all cursor-pointer"
          title="Restart Simulation Timeline"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Playback Speed Selector */}
        <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-[10px] font-mono font-bold">
          <FastForward className="w-3 h-3 text-sky-400 ml-1" />
          {[0.5, 1.0, 2.0, 5.0].map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedSelect(s)}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                playbackSpeed === s ? 'bg-sky-600 text-white font-extrabold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Step & Real Timestamp Info */}
        <div className="hidden sm:flex flex-col text-xs font-mono ml-2">
          <div className="flex items-center space-x-1.5 font-bold text-white">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-sky-300">T + {currentTimeHr} hr</span>
            <span className="text-slate-400">({simState.currentTimeMin.toFixed(0)}m / {durationMin}m)</span>
          </div>
          <span className="text-[10px] text-amber-300 font-bold">
            Step {currentStep} / {totalSteps} — {simState.stageName}
          </span>
        </div>
      </div>

      {/* Center Timeline Range Scrubber */}
      <div className="flex-1 w-full space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold px-1">
          <span>T+0.0h (Breach)</span>
          <span>T+0.5h (Surge)</span>
          <span>T+1.0h (Jet)</span>
          <span>T+2.0h (Peak)</span>
          <span>T+4.0h (Valley)</span>
          <span>T+{durationHr}h (Max)</span>
        </div>

        <input
          type="range"
          min="0"
          max={durationMin}
          step="1"
          value={simState.currentTimeMin}
          onChange={(e) => onScrub(parseFloat(e.target.value))}
          className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
        />
      </div>

      {/* Right Stage & Wave Front Indicator Badge */}
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
