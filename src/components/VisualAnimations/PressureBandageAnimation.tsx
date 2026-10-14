import React, { useState, useEffect } from 'react';
import { ShieldAlert, Play, Pause, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { soundCtrl } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface Props {
  initialSeconds?: number;
  caption: string;
}

export const PressureBandageAnimation: React.FC<Props> = ({ initialSeconds = 300, caption }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
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

  const progress = Math.min(100, Math.max(0, ((initialSeconds - secondsLeft) / initialSeconds) * 100));
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const hemostasisClotting = Math.round(progress);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-rose-950/40 border border-rose-500/30 p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-rose-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono tracking-wider text-rose-400 uppercase font-semibold">
              PROTOCOL: MECHANICAL HEMOSTASIS
            </span>
            <h4 className="text-base font-bold text-white">Continuous Direct Pressure</h4>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 font-mono">
          WHO Trauma Tier 1
        </span>
      </div>

      {/* Graphic Canvas / SVG with Animated Compression Force */}
      <div className="relative h-48 w-full rounded-xl bg-slate-950/80 border border-rose-500/20 flex flex-col items-center justify-center overflow-hidden">
        {/* Pulsing Compression Waves */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-36 h-36 rounded-full border-2 border-rose-500/30 animate-ping opacity-30"></div>
          <div className="w-48 h-48 rounded-full border border-rose-400/20 animate-pulse-ring"></div>
        </div>

        {/* Vector SVG showing Hands holding pressure cloth */}
        <svg viewBox="0 0 260 140" className="w-72 h-36 z-10">
          <defs>
            <linearGradient id="pressureCloth" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="armSkin" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>

          {/* Forearm base */}
          <rect x="20" y="85" width="220" height="40" rx="10" fill="url(#armSkin)" opacity="0.85" />

          {/* Wound area under cloth */}
          <ellipse cx="130" cy="85" rx="30" ry="6" fill="#be123c" />

          {/* Clean sterile gauze pad / cloth layer */}
          <rect x="85" y="65" width="90" height="25" rx="5" fill="url(#pressureCloth)" stroke="#94a3b8" strokeWidth="2" />

          {/* Downward Force Vector Arrows */}
          <g className="animate-bounce" style={{ animationDuration: '1.2s' }}>
            <line x1="110" y1="20" x2="110" y2="55" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
            <polygon points="103,50 110,62 117,50" fill="#f43f5e" />

            <line x1="150" y1="20" x2="150" y2="55" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
            <polygon points="143,50 150,62 157,50" fill="#f43f5e" />

            <text x="130" y="16" fill="#fda4af" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="1">
              FIRM 2-HANDED FORCE
            </text>
          </g>

          {/* Hands silhouette holding cloth down firmly */}
          <ellipse cx="130" cy="62" rx="42" ry="12" fill="#fb923c" opacity="0.9" />
          <ellipse cx="130" cy="58" rx="36" ry="8" fill="#fdba74" />
        </svg>

        {/* Real-time Hemostasis Status */}
        <div className="absolute bottom-2 left-4 flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 rounded-md px-2.5 py-1 text-xs">
          <span className="text-slate-400">Platelet Clotting:</span>
          <span className={`font-mono font-bold ${hemostasisClotting >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {hemostasisClotting}%
          </span>
          <span className="text-slate-500 text-[10px]">({hemostasisClotting >= 80 ? 'Hemostasis Formed' : 'Maintain Firm Hold'})</span>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 bg-rose-950/40 border border-rose-800/40 rounded-lg p-2.5 text-xs text-rose-200">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <span><strong>CRITICAL RULE:</strong> Do NOT lift the cloth to check the wound! Lifting tears away newly forming platelet clots and restarts bleeding.</span>
      </div>

      <p className="mt-2 text-xs text-slate-300 italic">{caption}</p>

      {/* 5-Minute Timer Controls */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 rounded-xl p-3 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="font-mono text-3xl font-extrabold tracking-wider text-rose-400">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-400">
            <div>Recommended hold: 5 min (300s)</div>
            <div className="text-rose-300 font-medium">
              {isCompleted ? 'Pressure Hold Finished' : isRunning ? 'Hold Firmly...' : 'Timer Paused'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" /> 5-Min Hold Completed
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-rose-500 text-white hover:bg-rose-400'
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
                  setSecondsLeft(initialSeconds);
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

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 h-full transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
