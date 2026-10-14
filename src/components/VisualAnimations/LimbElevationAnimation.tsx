import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { soundCtrl } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface Props {
  caption: string;
}

export const LimbElevationAnimation: React.FC<Props> = ({ caption }) => {
  const [secondsLeft, setSecondsLeft] = useState(900); // 15 minutes ice interval
  const [isRunning, setIsRunning] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isRunning && secondsLeft > 0) {
      interval = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            soundCtrl.playCompleteFanfare();
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-indigo-950/40 border border-indigo-500/30 p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-indigo-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <ArrowUpRight className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="text-xs font-mono tracking-wider text-indigo-400 uppercase font-semibold">
              RICE PROTOCOL: LYMPHATIC EDEMA REDUCTION
            </span>
            <h4 className="text-base font-bold text-white">Elevation Above Cardiac Plane</h4>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 font-mono">
          Anti-Swelling
        </span>
      </div>

      {/* SVG Elevation Diagram */}
      <div className="relative h-48 w-full rounded-xl bg-slate-950/80 border border-indigo-500/20 flex flex-col items-center justify-center overflow-hidden">
        <svg viewBox="0 0 260 140" className="w-72 h-36 z-10">
          <defs>
            <linearGradient id="cushionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="legGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>

          {/* Cardiac Reference Datum Line */}
          <line x1="20" y1="90" x2="240" y2="90" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
          <text x="30" y="85" fill="#f43f5e" fontSize="9" fontWeight="bold">HEART LEVEL</text>

          {/* Pillow / Cushion Support Stack */}
          <rect x="150" y="70" width="75" height="35" rx="8" fill="url(#cushionGrad)" opacity="0.8" />
          <rect x="160" y="55" width="60" height="25" rx="6" fill="#0ea5e9" opacity="0.9" />

          {/* Elevated Leg / Foot propped up */}
          <path
            d="M 40 105 Q 100 100 150 75 L 205 45 C 215 40, 225 55, 215 65 L 160 88 Q 110 115 40 115 Z"
            fill="url(#legGrad)"
          />

          {/* Cold Pack placed on ankle */}
          <rect x="175" y="38" width="30" height="14" rx="4" fill="#a5f3fc" stroke="#06b6d4" strokeWidth="1.5" />
          <text x="190" y="48" fill="#0e7490" fontSize="8" fontWeight="bold" textAnchor="middle">ICE WRAP</text>

          {/* Downward Gravity Drainage Arrows */}
          <g className="animate-pulse">
            <line x1="160" y1="65" x2="120" y2="85" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
            <polygon points="115,85 125,80 123,90" fill="#38bdf8" />
            <text x="145" y="80" fill="#38bdf8" fontSize="8" fontWeight="bold">GRAVITY FLOW</text>
          </g>
        </svg>

        {/* Live Elevation Status */}
        <div className="absolute bottom-2 left-4 flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 rounded-md px-2.5 py-1 text-xs">
          <span className="text-slate-400">Position:</span>
          <span className="font-mono font-bold text-indigo-300">+25cm Above Heart</span>
          <span className="text-slate-500 text-[10px]">(Max Drainage Rate)</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-indigo-200/90 italic bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-800/30">
        🏔️ {caption}
      </p>

      {/* Cold Pack Interval Timer */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 rounded-xl p-3 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="font-mono text-3xl font-extrabold tracking-wider text-indigo-300">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-400">
            <div>Cold Compress Interval: 15 min</div>
            <div className="text-indigo-400 font-medium">
              {isCompleted ? 'Interval Complete!' : isRunning ? 'Ice Compress Active' : 'Timer Paused'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" /> 15-Min Ice Cycle Done
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-indigo-500 text-white hover:bg-indigo-400'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Resume
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSecondsLeft(900);
                  setIsRunning(false);
                  setIsCompleted(false);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
