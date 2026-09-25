import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import type { SPHFrame, SPHParticleData } from '../../types';

interface SPHParticleCanvasProps {
  frames: SPHFrame[];
  columnWidthM?: number;
  domainLengthM?: number;
  domainHeightM?: number;
  experimentalNotice?: string;
}

export const SPHParticleCanvas: React.FC<SPHParticleCanvasProps> = ({
  frames,
  columnWidthM = 20,
  domainLengthM = 80,
  domainHeightM = 25,
  experimentalNotice,
}) => {
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [colorMode, setColorMode] = useState<'VELOCITY' | 'PRESSURE' | 'DEPTH'>('VELOCITY');
  const [hoveredParticle, setHoveredParticle] = useState<SPHParticleData | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const totalFrames = frames.length;
  const currentFrame = frames[currentFrameIdx] || frames[0];

  // Playback timer loop
  useEffect(() => {
    let interval: any;
    if (isPlaying && totalFrames > 0) {
      interval = setInterval(() => {
        setCurrentFrameIdx((prev) => (prev + 1) % totalFrames);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalFrames]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090d16'; // Dark slate/navy background
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSpacing = width / 10;
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Domain floor (y = 0) and left wall (x = 0)
    const padding = 30;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    const scaleX = plotWidth / domainLengthM;
    const scaleY = plotHeight / domainHeightM;

    // Floor baseline
    const floorCanvasY = height - padding;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(padding, floorCanvasY);
    ctx.lineTo(width - padding, floorCanvasY);
    ctx.stroke();

    // Left retention wall
    ctx.beginPath();
    ctx.moveTo(padding, floorCanvasY);
    ctx.lineTo(padding, padding);
    ctx.stroke();

    // Dam breach gate position marker (initial column width)
    const damCanvasX = padding + columnWidthM * scaleX;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(damCanvasX, floorCanvasY);
    ctx.lineTo(damCanvasX, padding);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    ctx.fillStyle = '#ef4444';
    ctx.font = '10px monospace';
    ctx.fillText('BREACH GATE', damCanvasX - 35, padding + 15);

    // Draw SPH Particles
    const particles = currentFrame.particles || [];
    particles.forEach((p) => {
      const cx = padding + p.x * scaleX;
      const cy = floorCanvasY - p.y * scaleY;

      // Calculate particle color according to selected mode
      let color = '#38bdf8'; // Default sky blue
      if (colorMode === 'VELOCITY') {
        const vMag = Math.hypot(p.velocity_x, p.velocity_y);
        const ratio = Math.min(1.0, vMag / 20.0);
        if (ratio < 0.3) color = '#0284c7'; // Cyan
        else if (ratio < 0.7) color = '#10b981'; // Emerald Green
        else if (ratio < 0.9) color = '#f59e0b'; // Amber
        else color = '#ef4444'; // Red
      } else if (colorMode === 'PRESSURE') {
        const ratio = Math.min(1.0, p.pressure / 150000.0);
        if (ratio < 0.25) color = '#38bdf8';
        else if (ratio < 0.6) color = '#818cf8';
        else color = '#e879f9';
      } else if (colorMode === 'DEPTH') {
        const ratio = Math.min(1.0, p.y / domainHeightM);
        color = `hsl(${200 + ratio * 60}, 80%, 55%)`;
      }

      // Draw particle circle with soft glow
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

  }, [currentFrame, colorMode, domainLengthM, domainHeightM, columnWidthM]);

  // Mouse move hover inspector
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrame) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    const scaleX = plotWidth / domainLengthM;
    const scaleY = plotHeight / domainHeightM;
    const floorCanvasY = height - padding;

    let found: SPHParticleData | null = null;
    const particles = currentFrame.particles || [];

    for (const p of particles) {
      const cx = padding + p.x * scaleX;
      const cy = floorCanvasY - p.y * scaleY;
      const dist = Math.hypot(mx - cx, my - cy);
      if (dist <= 10) {
        found = p;
        break;
      }
    }
    setHoveredParticle(found);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Notice Banner */}
      <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between text-xs text-amber-300">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">
            {experimentalNotice || "EXPERIMENTAL PROTOTYPE SPH SOLVER: Demonstrator model for particle hydrodynamics."}
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/80 font-mono font-bold uppercase">
          Lagrangian Particles
        </span>
      </div>

      {/* Playback & Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-all shadow-md"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentFrameIdx(0);
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
            title="Reset to Frame 0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="text-xs font-mono text-slate-300">
            Time: <span className="font-bold text-sky-400">{currentFrame?.time_sec || 0}s</span> / {frames[frames.length - 1]?.time_sec || 5}s
            <span className="text-slate-400 ml-2">(Frame {currentFrameIdx + 1}/{totalFrames})</span>
          </div>
        </div>

        {/* Color Mode Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Color Mode:</span>
          {(['VELOCITY', 'PRESSURE', 'DEPTH'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setColorMode(mode)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                colorMode === mode
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Scrubber Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>t = 0.0s</span>
          <span>Frame Step Scrubber</span>
          <span>t = {frames[frames.length - 1]?.time_sec || 5}s</span>
        </div>
        <input
          type="range"
          min="0"
          max={Math.max(0, totalFrames - 1)}
          value={currentFrameIdx}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentFrameIdx(parseInt(e.target.value));
          }}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
      </div>

      {/* HTML5 Canvas Component */}
      <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={380}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredParticle(null)}
          className="w-full h-[380px] cursor-crosshair block"
        />

        {/* Particle Hover Inspector Card */}
        {hoveredParticle && (
          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur border border-sky-500/50 p-3 rounded-xl text-xs space-y-1 font-mono shadow-2xl z-20 text-slate-200 w-52">
            <div className="font-bold text-sky-400 flex items-center justify-between border-b border-slate-800 pb-1">
              <span>Particle #{hoveredParticle.id}</span>
              <span className="text-[10px] text-emerald-400">{hoveredParticle.particle_type}</span>
            </div>
            <div>X: {hoveredParticle.x.toFixed(2)} m</div>
            <div>Y: {hoveredParticle.y.toFixed(2)} m</div>
            <div>Vx: {hoveredParticle.velocity_x.toFixed(2)} m/s</div>
            <div>Vy: {hoveredParticle.velocity_y.toFixed(2)} m/s</div>
            <div>|V|: {Math.hypot(hoveredParticle.velocity_x, hoveredParticle.velocity_y).toFixed(2)} m/s</div>
            <div>Density: {hoveredParticle.density.toFixed(1)} kg/m³</div>
            <div>Pressure: {(hoveredParticle.pressure / 1000).toFixed(2)} kPa</div>
            <div>Mass: {hoveredParticle.mass.toFixed(1)} kg</div>
          </div>
        )}
      </div>
    </div>
  );
};
