import React, { useState } from 'react';
import { PhoneCall, AlertOctagon, MapPin, Radio, CheckCircle2, X } from 'lucide-react';
import { soundCtrl } from '../utils/audio';

interface Props {
  emergencyCallRequired: boolean;
  urgencyLevel: string;
}

export const EmergencyBanner: React.FC<Props> = ({ emergencyCallRequired, urgencyLevel }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'calling' | 'connected'>('idle');

  if (!emergencyCallRequired && urgencyLevel !== 'CRITICAL_EMERGENCY') {
    return null;
  }

  const handleSimulateCall = () => {
    soundCtrl.playEmergencyAlert();
    setModalOpen(true);
    setDispatchStatus('calling');
    setTimeout(() => {
      setDispatchStatus('connected');
    }, 1800);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-650 via-red-600 to-rose-700 text-white p-4 shadow-xl border-2 border-red-400 animate-pulse">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
              <AlertOctagon className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs uppercase font-mono font-extrabold tracking-wider bg-black/40 px-2 py-0.5 rounded text-red-200">
                  LIFE-THREATENING EMERGENCY FLAG
                </span>
                <span className="text-xs font-bold text-red-100">Step #1 Priority</span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                Call Emergency Services (911 / 112) Immediately
              </h3>
              <p className="text-xs text-red-100 max-w-xl">
                Symptoms indicate high-risk trauma or arrest. Do NOT hesitate. Keep phone on speaker while following JARVIS co-pilot directives below.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateCall}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-red-700 font-extrabold text-sm hover:bg-red-50 active:scale-95 transition-all shadow-lg shadow-black/20 shrink-0"
          >
            <PhoneCall className="w-4 h-4 fill-current animate-bounce" />
            <span>DIAL 911 / 112 NOW</span>
          </button>
        </div>
      </div>

      {/* Emergency Call Simulation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border-2 border-red-500/80 p-6 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-500/20 text-red-400 border border-red-500">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-mono text-red-400 uppercase tracking-widest font-bold">
                  EMERGENCY DISPATCH SIMULATOR
                </span>
                <h4 className="text-lg font-bold">Emergency Dispatcher Link</h4>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 mb-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Call Status:</span>
                <span className={`font-bold ${dispatchStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                  {dispatchStatus === 'connected' ? 'CONNECTED (00:18)' : 'DIALING 911...'}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Geolocation Telemetry:
                </span>
                <span className="text-slate-200">37.7749° N, 122.4194° W</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>Nearest Trauma Center:</span>
                <span className="text-slate-200">St. Jude Regional Trauma I</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>Ambulance Unit:</span>
                <span className="text-cyan-400 font-bold">Medic-14 (ETA 4 min)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-200 mb-5 leading-relaxed">
              💡 <strong>Speakerphone Tip:</strong> Tell the dispatcher your exact address first, then state whether the victim is breathing and conscious. Put your device on speakerphone and follow the visual first-aid directives below.
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors"
              >
                Close Simulator & Return to Co-Pilot
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
