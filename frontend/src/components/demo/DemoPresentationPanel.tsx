import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_STEPS } from '../../data/demoStepsData';
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Sparkles,
  CheckCircle,
  Compass
} from 'lucide-react';

export const DemoPresentationPanel: React.FC = () => {
  const {
    isDemoMode,
    currentDemoStep,
    goToDemoStep,
    nextDemoStep,
    prevDemoStep,
    isDemoPlaying,
    toggleDemoPlay,
    demoSpeed,
    setDemoSpeed,
    isPresentationPanelOpen,
    togglePresentationPanel,
    isAudioNarratorActive,
    toggleAudioNarrator,
    setShowFinalSummaryModal
  } = useApp();

  const [timeRemainingSec, setTimeRemainingSec] = useState<number>(35);
  const [isSpeechSpeaking, setIsSpeechSpeaking] = useState<boolean>(false);

  const stepData = DEMO_STEPS.find((s) => s.step === currentDemoStep) || DEMO_STEPS[0];

  // Duration adjusted by demoSpeed (1x = ~37s each for 5min total)
  const stepDuration = Math.round(stepData.durationSec / demoSpeed);

  // Timer effect for auto-advancing steps
  useEffect(() => {
    if (!isDemoMode || !isDemoPlaying) return;

    setTimeRemainingSec(stepDuration);

    const interval = setInterval(() => {
      setTimeRemainingSec((prev) => {
        if (prev <= 1) {
          if (currentDemoStep < 8) {
            nextDemoStep();
          } else {
            toggleDemoPlay(); // pause on step 8
            setShowFinalSummaryModal(true);
          }
          return stepDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemoMode, isDemoPlaying, currentDemoStep, demoSpeed, stepDuration]);

  // Reset timer when step changes manually
  useEffect(() => {
    setTimeRemainingSec(stepDuration);

    // If text-to-speech narration is active, speak the step narrative!
    if (isAudioNarratorActive && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // stop previous speech
      const utterance = new SpeechSynthesisUtterance(stepData.narrative);
      utterance.rate = 1.05 * demoSpeed;
      utterance.onend = () => setIsSpeechSpeaking(false);
      utterance.onerror = () => setIsSpeechSpeaking(false);
      setIsSpeechSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  }, [currentDemoStep, isAudioNarratorActive]);

  // Stop speech if panel or audio narration is toggled off
  useEffect(() => {
    if (!isAudioNarratorActive && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeechSpeaking(false);
    }
  }, [isAudioNarratorActive]);

  if (!isDemoMode) return null;

  const progressPercent = Math.max(0, Math.min(100, ((stepDuration - timeRemainingSec) / stepDuration) * 100));

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-lg w-full px-2 sm:px-0 transition-all duration-300">
      <div className="bg-slate-900/95 border border-slate-700/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        
        {/* Panel Header */}
        <div className="bg-gradient-to-r from-sky-900/90 via-slate-900 to-teal-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sky-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 font-mono">
                  [DEMO MODE: STEP {currentDemoStep}/8]
                </span>
                <span className="text-[9px] bg-sky-950 text-sky-300 border border-sky-800/80 px-1.5 py-0.2 rounded font-mono">
                  ~5 MIN TOUR
                </span>
              </div>
              <h3 className="text-xs font-black text-white truncate max-w-[220px]">
                {stepData.step}. {stepData.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {/* Speed Selector */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono mr-1">
              {[1, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setDemoSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                    demoSpeed === spd
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`${spd}x Speed`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Audio Speech Narration Toggle */}
            <button
              onClick={toggleAudioNarrator}
              className={`p-1.5 rounded-lg border text-xs transition-all ${
                isAudioNarratorActive
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isAudioNarratorActive ? 'Speech Narration Enabled' : 'Enable Speech Narration'}
            >
              {isAudioNarratorActive ? (
                <Volume2 className={`w-3.5 h-3.5 ${isSpeechSpeaking ? 'animate-bounce text-emerald-400' : ''}`} />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Expand / Minimize Toggle */}
            <button
              onClick={togglePresentationPanel}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-all"
              title={isPresentationPanelOpen ? 'Minimize Panel' : 'Expand Presentation Panel'}
            >
              {isPresentationPanelOpen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Step Progress Line Bar */}
        <div className="w-full bg-slate-950 h-1 relative overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Main Body Content (Collapsible) */}
        {isPresentationPanelOpen && (
          <div className="p-4 space-y-3.5 max-h-80 overflow-y-auto">
            
            {/* Step Subtitle & Quick Summary */}
            <div>
              <div className="text-[11px] font-bold text-sky-300 font-sans leading-tight">
                {stepData.subtitle}
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed font-normal">
                {stepData.narrative}
              </p>
            </div>

            {/* HADR Operational Context Alert */}
            <div className="p-2.5 bg-sky-950/40 border border-sky-800/60 rounded-xl text-[11px] text-sky-200 space-y-1">
              <div className="font-bold text-sky-300 text-[10px] uppercase tracking-wider flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>HADR Decision Support Context:</span>
              </div>
              <p className="leading-snug text-slate-300">
                {stepData.hadrContext}
              </p>
            </div>

            {/* Key Technical Highlights Bullets */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Key Technical Parameters:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                {stepData.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 text-slate-300">
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics Quick Preview Badges */}
            {stepData.metricsPreview && (
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800">
                {stepData.metricsPreview.map((m, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800/80 p-1.5 rounded-lg text-center">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">{m.label}</div>
                    <div className={`text-xs font-extrabold font-mono ${m.color}`}>{m.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Panel Footer Controls */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
          
          {/* Step Selector Dots */}
          <div className="flex items-center space-x-1 overflow-x-auto py-1">
            {DEMO_STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => goToDemoStep(s.step)}
                className={`w-5 h-5 rounded-full text-[10px] font-bold font-mono transition-all flex items-center justify-center ${
                  currentDemoStep === s.step
                    ? 'bg-sky-500 text-slate-950 shadow-md scale-110'
                    : currentDemoStep > s.step
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
                title={`Step ${s.step}: ${s.title}`}
              >
                {s.step}
              </button>
            ))}
          </div>

          {/* Navigation Controls: Prev, Play/Pause, Next */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={prevDemoStep}
              disabled={currentDemoStep === 1}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-700 transition-all"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <button
              onClick={toggleDemoPlay}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 flex items-center space-x-1.5 shadow transition-all ${
                isDemoPlaying
                  ? 'bg-amber-400 hover:bg-amber-300'
                  : 'bg-emerald-400 hover:bg-emerald-300'
              }`}
              title={isDemoPlaying ? 'Pause Auto-Play' : 'Start Auto-Play (~5 min)'}
            >
              {isDemoPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (currentDemoStep === 8) {
                  setShowFinalSummaryModal(true);
                } else {
                  nextDemoStep();
                }
              }}
              className="p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow transition-all"
              title={currentDemoStep === 8 ? 'View Final Summary' : 'Next Step'}
            >
              <span className="hidden sm:inline">{currentDemoStep === 8 ? 'Summary' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
