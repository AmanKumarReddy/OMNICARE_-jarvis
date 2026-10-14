import React, { useState, useEffect } from 'react';
import { Heart, Volume2, VolumeX, Play, Pause, Activity } from 'lucide-react';
import { soundCtrl } from '../../utils/audio';

interface Props {
  bpm?: number;
  caption: string;
}

export const CPRMetronomeAnimation: React.FC<Props> = ({ bpm: initialBpm = 110, caption }) => {
  const [bpm, setBpm] = useState(initialBpm || 110);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [compressionCount, setCompressionCount] = useState(1);
  const [cycleCount, setCycleCount] = useState(1);

  // Sync metronome with Web Audio API sound generator
  useEffect(() => {
    if (isPlaying) {
      soundCtrl.startCPRMetronome(bpm, (count) => {
        setCompressionCount(count);
        if (count === 30) {
          setCycleCount((prev) => prev + 1);
        }
      });
    } else {
      soundCtrl.stopCPRMetronome();
    }

    return () => {
      soundCtrl.stopCPRMetronome();
    };
  }, [isPlaying, bpm]);

  const toggleSound = () => {
    if (!isMuted) {
      soundCtrl.stopCPRMetronome();
      setIsMuted(true);
    } else {
      setIsMuted(false);
      if (isPlaying) {
        soundCtrl.startCPRMetronome(bpm, (count) => {
          setCompressionCount(count);
        });
      }
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-red-950/50 border border-red-500/40 p-5 shadow-2xl">
      {/* HUD Header */}
      <div className="flex items-center justify-between mb-4 border-b border-red-500/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono tracking-wider text-red-400 uppercase font-semibold">
              CRITICAL LIFE SUPPORT: CPR CADENCE CO-PILOT
            </span>
            <h4 className="text-base font-bold text-white">100 - 120 Beats Per Minute</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors ${
              isMuted
                ? 'bg-slate-800 border-slate-700 text-slate-400'
                : 'bg-red-500/20 border-red-500/40 text-red-300'
            }`}
            title={isMuted ? 'Unmute Audio Metronome' : 'Mute Audio Metronome'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio Click'}</span>
          </button>
          <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/30 text-red-200 border border-red-400 font-mono font-bold">
            AHA/ERC 2024
          </span>
        </div>
      </div>

      {/* Pulsating Cardiac Compression Canvas/SVG */}
      <div className="relative h-56 w-full rounded-xl bg-slate-950/90 border border-red-500/30 flex flex-col items-center justify-center overflow-hidden">
        {/* Pulsating Target Waves synchronized with compression count */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform"
          style={{
            transform: isPlaying ? 'scale(1.05)' : 'scale(1)',
            transitionDuration: `${60 / bpm / 2}s`
          }}
        >
          <div className="w-48 h-48 rounded-full border-2 border-red-500/20 animate-ping opacity-25"></div>
          <div className="w-36 h-36 rounded-full bg-red-600/10 blur-xl"></div>
        </div>

        {/* Central Anatomical Chest & Heart Visual */}
        <svg viewBox="0 0 240 160" className="w-72 h-44 z-10">
          <defs>
            <radialGradient id="heartGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#b91c1c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.4" />
            </radialGradient>
          </defs>

          {/* Torso / Ribcage Outline */}
          <ellipse cx="120" cy="110" rx="90" ry="45" fill="#1e293b" opacity="0.6" stroke="#475569" strokeWidth="2" />
          <path d="M 120 40 L 120 135" stroke="#64748b" strokeWidth="3" strokeDasharray="3 3" />

          {/* Beating Heart Shape */}
          <g
            transform={`translate(120, 85) scale(${isPlaying ? 0.95 + (compressionCount % 2 === 0 ? 0.12 : 0) : 1}) translate(-120, -85)`}
            className="transition-transform duration-100 origin-center"
          >
            <path
              d="M 120 100 C 95 65, 75 75, 75 95 C 75 115, 120 135, 120 135 C 120 135, 165 115, 165 95 C 165 75, 145 65, 120 100 Z"
              fill="url(#heartGlow)"
              filter="drop-shadow(0 0 12px rgba(239,68,68,0.7))"
            />
          </g>

          {/* Rescuer Hands Interlocked in Center */}
          <g
            transform={`translate(120, ${isPlaying && compressionCount % 2 === 0 ? 76 : 68}) translate(-120, -70)`}
            className="transition-transform duration-100"
          >
            {/* Heel of lower hand */}
            <rect x="98" y="70" width="44" height="20" rx="8" fill="#f97316" stroke="#ea580c" strokeWidth="2" />
            {/* Upper interlocking fingers */}
            <rect x="92" y="60" width="56" height="16" rx="6" fill="#fb923c" stroke="#f97316" strokeWidth="1.5" />
            {/* Wrist support */}
            <path d="M 108 50 L 108 60 M 132 50 L 132 60" stroke="#fdba74" strokeWidth="6" strokeLinecap="round" />
            {/* Compression depth arrows */}
            <line x1="120" y1="36" x2="120" y2="52" stroke="#ffffff" strokeWidth="2.5" markerEnd="url(#arrow)" />
          </g>
        </svg>

        {/* Compression Depth & Recoil HUD readout */}
        <div className="absolute top-3 left-4 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
          <span className="text-slate-400">Target Depth:</span>
          <span className="font-mono font-bold text-red-300">5 - 6 cm (2 inches)</span>
        </div>

        <div className="absolute top-3 right-4 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
          <span className="text-slate-400">Recoil:</span>
          <span className="font-mono font-bold text-emerald-400">100% Full Chest Rise</span>
        </div>

        {/* Live Compression Counter Meter */}
        <div className="absolute bottom-2 inset-x-4 flex items-center justify-between bg-slate-900/95 border border-red-500/40 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Compression Beat:</span>
            <span className="font-mono text-xl font-black text-red-400">
              {compressionCount} <span className="text-slate-500 text-xs">/ 30</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Cycle:</span>
            <span className="font-mono font-bold text-amber-300">#{cycleCount}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-red-200 italic bg-red-950/40 p-2.5 rounded-lg border border-red-800/40">
        📢 {caption}
      </p>

      {/* Cadence Speed Control Bar */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 rounded-xl p-3 border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" /> Pause Metronome
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Start CPR Metronome
              </>
            )}
          </button>
          <div className="text-xs text-slate-400">
            <span className="text-white font-mono font-bold text-sm">{bpm} BPM</span>
            <span className="block text-[11px] text-slate-400">Cadence rhythm</span>
          </div>
        </div>

        {/* BPM Quick Switcher */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1">Rhythm:</span>
          {[100, 110, 120].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setBpm(rate)}
              className={`px-2.5 py-1 rounded-md font-mono transition-colors ${
                bpm === rate
                  ? 'bg-red-500 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {rate}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
