import React, { useState } from 'react';
import { Volume2, VolumeX, CheckSquare, Square, XCircle, AlertTriangle, ShieldCheck, HeartPulse } from 'lucide-react';
import { speechCtrl } from '../utils/speech';

interface Props {
  reassurance: string;
  visualDetection: string;
  actionSteps: string[];
  whatNotToDo: string[];
  spokenResponse: string;
  ttsEnabled: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
}

export const ActionChecklist: React.FC<Props> = ({
  reassurance,
  visualDetection,
  actionSteps,
  whatNotToDo,
  spokenResponse,
  ttsEnabled,
  fontSize,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [activeReadingIdx, setActiveReadingIdx] = useState<number | null>(null);

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const speakFullProtocol = () => {
    if (speechCtrl.isSpeaking()) {
      speechCtrl.stop();
      setActiveReadingIdx(null);
    } else {
      speechCtrl.speak(spokenResponse || reassurance, () => {
        setActiveReadingIdx(null);
      });
    }
  };

  const speakStep = (idx: number, text: string) => {
    if (activeReadingIdx === idx) {
      speechCtrl.stop();
      setActiveReadingIdx(null);
    } else {
      setActiveReadingIdx(idx);
      speechCtrl.speak(text, () => {
        setActiveReadingIdx(null);
      });
    }
  };

  // Font size classes based on accessibility scaler
  const textSizeClass =
    fontSize === 'xlarge'
      ? 'text-lg leading-relaxed'
      : fontSize === 'large'
      ? 'text-base leading-relaxed'
      : 'text-sm leading-normal';

  const headingSizeClass =
    fontSize === 'xlarge' ? 'text-2xl' : fontSize === 'large' ? 'text-xl' : 'text-lg';

  return (
    <div className="space-y-4">
      {/* Calming Reassurance Card */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-cyan-950/60 border border-teal-500/30 p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0 mt-0.5">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-400">
                CALMING REASSURANCE PROTOCOL (PANIC DE-ESCALATION)
              </span>
              <p className={`mt-1 font-semibold text-white ${textSizeClass}`}>
                "{reassurance}"
              </p>
            </div>
          </div>

          {/* Audio Readout Button */}
          <button
            type="button"
            onClick={speakFullProtocol}
            className="p-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 shrink-0 transition-colors"
            title="Read Protocol Aloud (Calming Voice)"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Clinical Detection Summary */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Multimodal Sensory Visual Detection:</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono leading-relaxed">
          {visualDetection}
        </p>
      </div>

      {/* Step-by-Step Evidence-Based Action Checklist */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase font-bold">
              EVIDENCE-BASED ACTIONS (IFRC & WHO ALIGNED)
            </span>
            <h3 className={`font-black text-white ${headingSizeClass}`}>
              Step-by-Step Triage Checklist
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            {Object.values(completedSteps).filter(Boolean).length} / {actionSteps.length} Done
          </span>
        </div>

        <div className="space-y-3">
          {actionSteps.map((step, idx) => {
            const isDone = Boolean(completedSteps[idx]);
            const isSpeakingThis = activeReadingIdx === idx;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30 opacity-70'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleStep(idx)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                  title={isDone ? 'Mark Incomplete' : 'Mark Completed'}
                >
                  {isDone ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 hover:text-slate-400" />
                  )}
                </button>

                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isDone ? 'line-through text-slate-400' : 'text-slate-200'
                    } ${textSizeClass}`}
                  >
                    {step}
                  </p>
                </div>

                {/* Individual Step TTS Speaker Button */}
                <button
                  type="button"
                  onClick={() => speakStep(idx, step)}
                  className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                    isSpeakingThis
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Speak this step aloud"
                >
                  {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* WHAT NOT TO DO: Critical Danger Alerts */}
      {whatNotToDo && whatNotToDo.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-b from-rose-950/30 to-slate-900/90 border border-rose-500/40 p-4 sm:p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3 border-b border-rose-500/20 pb-3">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-rose-400">
                CRITICAL WARNINGS: COMMON DANGEROUS MISTAKES
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white">
                What NOT To Do (Avoid Harm)
              </h4>
            </div>
          </div>

          <div className="space-y-2">
            {whatNotToDo.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 bg-rose-950/40 border border-rose-900/40 p-3 rounded-xl text-xs sm:text-sm text-rose-200 leading-relaxed"
              >
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
