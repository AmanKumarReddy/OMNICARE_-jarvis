import React, { useState, useEffect } from 'react';
import { Wind, Play, Pause, Sparkles } from 'lucide-react';
import { soundCtrl } from '../../utils/audio';

interface Props {
  caption: string;
}

type BreathPhase = 'INHALE' | 'HOLD' | 'EXHALE';

export const BreathBubbleAnimation: React.FC<Props> = ({ caption }) => {
  const [phase, setPhase] = useState<BreathPhase>('INHALE');
  const [secondsInPhase, setSecondsInPhase] = useState(4);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive) return;

    const interval = window.setInterval(() => {
      setSecondsInPhase((prev) => {
        if (prev <= 1) {
          // Advance phase
          if (phase === 'INHALE') {
            setPhase('HOLD');
            return 7;
          } else if (phase === 'HOLD') {
            setPhase('EXHALE');
            return 8;
          } else {
            setPhase('INHALE');
            soundCtrl.playCalmChime();
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, phase]);

  const getPhaseDetails = () => {
    switch (phase) {
      case 'INHALE':
        return {
          title: 'Breathe In Deeply...',
          subtitle: 'Fill your chest with calm air through your nose',
          color: 'from-emerald-400 via-teal-300 to-cyan-500',
          scale: 'scale-125',
          duration: 'duration-4000',
        };
      case 'HOLD':
        return {
          title: 'Hold Gently...',
          subtitle: 'Pause your breath and feel your heart slow down',
          color: 'from-cyan-400 via-sky-300 to-indigo-400',
          scale: 'scale-125',
          duration: 'duration-1000',
        };
      case 'EXHALE':
        return {
          title: 'Slowly Exhale...',
          subtitle: 'Release all tension through your mouth like blowing a candle',
          color: 'from-indigo-400 via-purple-300 to-pink-400',
          scale: 'scale-75',
          duration: 'duration-8000',
        };
    }
  };

  const details = getPhaseDetails();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-teal-950/40 border border-teal-500/30 p-5 shadow-2xl">
      {/* HUD Header */}
      <div className="flex items-center justify-between mb-4 border-b border-teal-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <Wind className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono tracking-wider text-teal-400 uppercase font-semibold">
              PANIC NEUTRALIZATION: 4-7-8 REGULATION
            </span>
            <h4 className="text-base font-bold text-white">Vagus Nerve Calming Rhythm</h4>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" /> Anxiety Reduction
        </div>
      </div>

      {/* Expanding / Contracting Orb Graphic */}
      <div className="relative h-60 w-full rounded-xl bg-slate-950/80 border border-teal-500/20 flex flex-col items-center justify-center overflow-hidden">
        {/* Glowing Orb */}
        <div
          className={`w-36 h-36 rounded-full bg-gradient-to-br ${details.color} opacity-85 shadow-[0_0_50px_rgba(20,184,166,0.5)] transition-transform ease-in-out flex flex-col items-center justify-center p-4 text-center cursor-pointer ${
            isActive ? details.scale : 'scale-90'
          }`}
          style={{ transitionDuration: phase === 'INHALE' ? '4000ms' : phase === 'EXHALE' ? '8000ms' : '500ms' }}
          onClick={() => setIsActive(!isActive)}
        >
          <span className="font-mono text-3xl font-black text-slate-950 drop-shadow-sm">
            {secondsInPhase}s
          </span>
          <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mt-0.5">
            {phase}
          </span>
        </div>

        {/* Phase instructions */}
        <div className="absolute bottom-3 text-center">
          <h5 className="text-sm font-bold text-white">{details.title}</h5>
          <p className="text-xs text-slate-400">{details.subtitle}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-teal-200/90 italic bg-teal-950/30 p-2.5 rounded-lg border border-teal-800/30">
        🌿 {caption}
      </p>

      {/* Controller */}
      <div className="mt-4 flex items-center justify-between bg-slate-950/60 rounded-xl p-3 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isActive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-teal-500 text-slate-950 hover:bg-teal-400'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Breathing
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Resume Breathing
              </>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Phase Cadence: 4s Inhale → 7s Hold → 8s Exhale
        </div>
      </div>
    </div>
  );
};
