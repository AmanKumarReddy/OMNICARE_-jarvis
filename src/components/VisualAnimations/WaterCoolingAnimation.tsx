import React, { useState, useEffect } from 'react';
import { Droplets, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { soundCtrl } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface Props {
  initialSeconds?: number;
  caption: string;
}

export const WaterCoolingAnimation: React.FC<Props> = ({ initialSeconds = 600, caption }) => {
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
  // Simulated skin temperature reduction from 42°C to safe 20°C
  const currentTemp = Math.round(42 - (progress / 100) * 22);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-cyan-950/40 border border-cyan-500/30 p-5 shadow-2xl">
      {/* HUD Header */}
      <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Droplets className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="text-xs font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              PROTOCOL: CONTINUOUS COOL WATER THERAPY
            </span>
            <h4 className="text-base font-bold text-white">Active Thermal Dissipation</h4>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono">
          IFRC Certified
        </span>
      </div>

      {/* Dynamic Animated Stream Graphic */}
      <div className="relative h-48 w-full rounded-xl bg-slate-950/80 border border-cyan-500/20 flex flex-col items-center justify-center overflow-hidden">
        {/* Animated Water Jets */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute left-1/2 -top-10 -translate-x-1/2 w-24 h-48 bg-gradient-to-b from-cyan-400/60 via-blue-500/40 to-transparent blur-md animate-pulse"></div>
          {/* Bubbles / drops */}
          <div className="absolute left-[45%] top-10 w-2 h-2 rounded-full bg-cyan-300 animate-ping"></div>
          <div className="absolute left-[54%] top-16 w-2.5 h-2.5 rounded-full bg-sky-200 animate-pulse"></div>
          <div className="absolute left-[48%] top-28 w-3 h-3 rounded-full bg-cyan-400/80 animate-bounce"></div>
        </div>

        {/* Central Hand & Water Stream SVG */}
        <svg viewBox="0 0 240 140" className="w-64 h-36 z-10">
          <defs>
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="handGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Tap Spout */}
          <rect x="105" y="0" width="30" height="18" rx="3" fill="#64748b" />
          <path d="M110 18 L130 18 L126 30 L114 30 Z" fill="#94a3b8" />

          {/* Running Water Stream */}
          <path
            d="M 116 30 Q 112 70 100 95 Q 120 102 140 95 Q 128 70 124 30 Z"
            fill="url(#waterGrad)"
            filter="url(#glow)"
            className="animate-pulse"
          />

          {/* Water Splash Ripples on Hand */}
          <ellipse cx="120" cy="95" rx="35" ry="8" fill="none" stroke="#67e8f9" strokeWidth="2" strokeDasharray="4 3" className="animate-spin" />
          <ellipse cx="120" cy="98" rx="22" ry="5" fill="#38bdf8" opacity="0.5" />

          {/* Resting Hand/Forearm silhouette */}
          <path
            d="M 40 115 C 70 105, 95 95, 120 95 C 150 95, 175 102, 205 118 L 195 130 C 165 118, 145 110, 120 110 C 90 110, 65 118, 35 128 Z"
            fill="url(#handGrad)"
            opacity="0.9"
          />

          {/* Soothing heat waves dissipating */}
          <path d="M 90 85 Q 85 75 90 65" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d="M 150 85 Q 155 75 150 65" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
        </svg>

        {/* Live Thermal Temperature Reading */}
        <div className="absolute bottom-2 left-4 flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 rounded-md px-2.5 py-1 text-xs">
          <span className="text-slate-400">Tissue Temp:</span>
          <span className={`font-mono font-bold ${currentTemp <= 22 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {currentTemp}°C
          </span>
          <span className="text-slate-500 text-[10px]">({currentTemp <= 22 ? 'Thermal Heat Neutralized' : 'Cooling in progress'})</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-cyan-200/90 leading-relaxed italic bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-800/30">
        💡 {caption}
      </p>

      {/* Countdown Timer Controls */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 rounded-xl p-3 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="font-mono text-3xl font-extrabold tracking-wider text-cyan-300">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-400">
            <div>Target: 10 min (600s)</div>
            <div className="text-cyan-400 font-medium">
              {isCompleted ? 'Cooling Complete!' : isRunning ? 'Timer Running' : 'Timer Paused'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" /> Recommended Duration Reached
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
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
          className="bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 h-full transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
