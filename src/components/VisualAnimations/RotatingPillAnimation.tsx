import React, { useRef, useEffect, useState } from 'react';
import { Pill, Clock, GlassWater, Utensils, Bell, Check, Sparkles } from 'lucide-react';
import { soundCtrl } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface Props {
  caption: string;
}

export const RotatingPillAnimation: React.FC<Props> = ({ caption }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [activeSlot, setActiveSlot] = useState<'morning' | 'noon' | 'evening' | 'night'>('morning');
  const [doseTaken, setDoseTaken] = useState(false);

  // 3D holographic pill rendering using HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw Holographic circular grid rings
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 95, 0, Math.PI * 2);
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();

      // Holographic depth transformation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle * 0.5);

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Capsule Geometry (Two-tone: Medical Red & Crisp White)
      const pillLength = 70;
      const pillRadius = 26;

      ctx.scale(1, 0.85 + 0.15 * cosA);

      // Left Half (Crimson/Coral)
      ctx.beginPath();
      ctx.arc(-pillLength / 4, 0, pillRadius, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.lineTo(0, -pillRadius);
      ctx.lineTo(0, pillRadius);
      ctx.closePath();

      const redGrad = ctx.createLinearGradient(-pillLength, -pillRadius, 0, pillRadius);
      redGrad.addColorStop(0, '#ef4444');
      redGrad.addColorStop(0.5, '#f87171');
      redGrad.addColorStop(1, '#dc2626');
      ctx.fillStyle = redGrad;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
      ctx.shadowBlur = 15;
      ctx.fill();

      // Right Half (Clinical Crisp White/Cyan)
      ctx.beginPath();
      ctx.arc(pillLength / 4, 0, pillRadius, (3 * Math.PI) / 2, Math.PI / 2);
      ctx.lineTo(0, pillRadius);
      ctx.lineTo(0, -pillRadius);
      ctx.closePath();

      const whiteGrad = ctx.createLinearGradient(0, -pillRadius, pillLength, pillRadius);
      whiteGrad.addColorStop(0, '#f8fafc');
      whiteGrad.addColorStop(0.5, '#e2e8f0');
      whiteGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = whiteGrad;
      ctx.shadowColor = 'rgba(248, 250, 252, 0.5)';
      ctx.shadowBlur = 12;
      ctx.fill();

      // Pill Specular Glare (Light reflection shine)
      ctx.beginPath();
      ctx.ellipse(-10, -10, 22, 6, -Math.PI / 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();

      // Center seam ring
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -pillRadius);
      ctx.lineTo(0, pillRadius);
      ctx.stroke();

      ctx.restore();

      if (isRotating) {
        angle += 0.025;
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRotating]);

  const handleMarkDose = () => {
    setDoseTaken(true);
    soundCtrl.playCalmChime();
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-sky-950/40 border border-sky-500/30 p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-sky-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Pill className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono tracking-wider text-sky-400 uppercase font-semibold">
              ACCESSIBLE MEDICATION HOLOGRAM
            </span>
            <h4 className="text-base font-bold text-white">3D Holographic Dosage Schedule</h4>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" /> High-Vision Aid
        </div>
      </div>

      {/* 3D Hologram Stage & Canvas */}
      <div className="relative h-52 w-full rounded-xl bg-slate-950/80 border border-sky-500/20 flex items-center justify-center overflow-hidden">
        {/* Hologram scanline */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/5 to-transparent animate-scanline pointer-events-none" />

        <canvas
          ref={canvasRef}
          width={280}
          height={180}
          className="z-10 cursor-pointer"
          onClick={() => setIsRotating(!isRotating)}
          title="Click to Pause/Resume 3D Rotation"
        />

        {/* Floating Dosage Metadata Badges */}
        <div className="absolute top-3 left-4 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-md text-slate-300">
            <GlassWater className="w-3.5 h-3.5 text-sky-400" />
            <span>Take with 250ml Water</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-md text-slate-300">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>Strictly with Meals</span>
          </div>
        </div>

        <div className="absolute top-3 right-4 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-md text-xs font-mono">
          <span className="text-slate-400">Rotation:</span>{' '}
          <span className="text-sky-300 font-bold">{isRotating ? 'Active' : 'Paused'}</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-sky-200/90 italic bg-sky-950/30 p-2.5 rounded-lg border border-sky-800/30">
        💊 {caption}
      </p>

      {/* Daily Dosage Schedule Matrix */}
      <div className="mt-4 bg-slate-950/60 rounded-xl p-3 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" /> Recommended Daily Schedule:
          </span>
          <span className="text-[11px] font-mono text-slate-400">Interval: Every 8 Hours</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'morning', label: 'Morning', time: '08:00 AM', dose: '1 Cap' },
            { id: 'noon', label: 'Afternoon', time: '02:00 PM', dose: '1 Cap' },
            { id: 'evening', label: 'Evening', time: '08:00 PM', dose: '1 Cap' },
            { id: 'night', label: 'Bedtime', time: '10:00 PM', dose: 'Rest' },
          ].map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => setActiveSlot(slot.id as any)}
              className={`p-2 rounded-lg text-left border transition-all ${
                activeSlot === slot.id
                  ? 'bg-sky-500/20 border-sky-400 text-white shadow-md'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-bold text-sky-300">{slot.label}</div>
              <div className="text-[10px] text-slate-400 font-mono">{slot.time}</div>
              <div className="text-xs font-semibold mt-1 text-white">{slot.dose}</div>
            </button>
          ))}
        </div>

        {/* Mark Taken Button */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="text-xs text-slate-400">
            Selected: <span className="text-white font-bold capitalize">{activeSlot}</span> dose
          </div>
          <button
            type="button"
            onClick={handleMarkDose}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              doseTaken
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-lg'
            }`}
          >
            {doseTaken ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Logged & Recorded
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" /> Mark Dose Taken
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
