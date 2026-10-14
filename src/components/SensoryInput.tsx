import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Mic, MicOff, Sparkles, AlertCircle, RefreshCw, X, Flame, ShieldAlert, Heart, Activity, Pill, Stethoscope } from 'lucide-react';
import { OmnicareMode, PresetCase } from '../types';
import { PRESET_CASES } from '../data/presets';
import { createSpeechRecognizer } from '../utils/speech';

interface Props {
  mode: OmnicareMode;
  onAnalyze: (payload: { imageBase64?: string; mimeType?: string; prompt?: string }) => void;
  onSelectPreset: (preset: PresetCase) => void;
  isLoading: boolean;
}

export const SensoryInput: React.FC<Props> = ({
  mode,
  onAnalyze,
  onSelectPreset,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'text'>('camera');
  const [promptText, setPromptText] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string>('image/jpeg');
  const [isListening, setIsListening] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start webcam
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access unavailable or blocked. You can upload an image or select a preset case.');
      setIsCameraActive(false);
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Capture frame from webcam
  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewImage(base64);
    setPreviewMimeType('image/jpeg');
    stopCamera();
  };

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewImage(result);
      setPreviewMimeType(file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  // Voice Dictation
  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript) => {
        setPromptText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      }
    );

    if (recognizer) {
      setIsListening(true);
      recognizer.start();
    } else {
      alert('Speech recognition is not supported in this browser. Please type your query.');
    }
  };

  // Submit Analysis
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!previewImage && !promptText.trim()) return;

    onAnalyze({
      imageBase64: previewImage || undefined,
      mimeType: previewMimeType,
      prompt: promptText.trim() || undefined,
    });
  };

  // Filter Presets matching current mode
  const filteredPresets = PRESET_CASES.filter((p) => p.mode === mode);

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 md:p-5 shadow-xl">
      {/* Tab Selectors */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'camera'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'upload'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'text'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice / Text</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multimodal Sensory Ingestion</span>
        </div>
      </div>

      {/* Main Sensory Viewport */}
      <div className="mb-4">
        {/* Camera Viewfinder */}
        {activeTab === 'camera' && (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video sm:h-64 w-full flex items-center justify-center border border-slate-800">
            {previewImage ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img src={previewImage} alt="Captured frame" className="max-h-full max-w-full object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(null);
                    startCamera();
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700"
                  title="Retake Photo"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-4 bg-slate-950/80 px-2.5 py-1 rounded-md text-xs font-mono text-emerald-400 border border-emerald-500/40">
                  ✓ Snapshot Captured In-Memory
                </div>
              </div>
            ) : isCameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* HUD Reticle Overlay */}
                <div className="absolute inset-8 pointer-events-none border border-cyan-400/40 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400 absolute top-0 left-0"></div>
                  <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400 absolute top-0 right-0"></div>
                  <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400 absolute bottom-0 left-0"></div>
                  <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400 absolute bottom-0 right-0"></div>
                  <span className="text-[11px] font-mono bg-slate-950/70 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                    ALIGN {mode === 'INJURY_FIRST_AID' ? 'INJURY WOUND' : 'MEDICINE STRIP / BOTTLE'}
                  </span>
                </div>

                {/* Capture Button */}
                <button
                  type="button"
                  onClick={captureFrame}
                  className="absolute bottom-4 px-5 py-2 rounded-xl bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 hover:bg-cyan-300 shadow-xl shadow-cyan-400/30 transition-transform active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>CAPTURE SNAPSHOT</span>
                </button>
              </>
            ) : (
              <div className="p-6 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                <p className="text-xs mb-3">{cameraError || 'Camera feed paused or permissions required.'}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                >
                  Start Camera Feed
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload Viewport */}
        {activeTab === 'upload' && (
          <div className="relative rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-950/50 p-6 text-center transition-colors">
            {previewImage ? (
              <div className="relative flex flex-col items-center">
                <img src={previewImage} alt="Uploaded preview" className="max-h-48 rounded-lg object-contain mb-3" />
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1 rounded-full bg-rose-500 text-white text-xs hover:bg-rose-600 flex items-center gap-1 px-3 py-1"
                >
                  <X className="w-3.5 h-3.5" /> Remove Image
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer py-4"
              >
                <Upload className="w-10 h-10 mx-auto mb-2 text-cyan-400 animate-bounce" />
                <h5 className="text-sm font-bold text-white mb-1">
                  Drag & Drop or Click to Upload
                </h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Upload an image of a burn, cut, sprain, or photo of medicine strips, prescription bottles, or pharmacy labels.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}

        {/* Text / Voice Box */}
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={
                mode === 'INJURY_FIRST_AID'
                  ? 'Describe injury (e.g., "Boiling water spilled on hand, skin is blistering" or "Cut arm with heavy bleeding")...'
                  : 'Ask about medicine (e.g., "How to take Amoxicillin 500mg?" or "Can I take Metformin before eating?")...'
              }
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 pr-10"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
              title={isListening ? 'Listening... Click to Stop' : 'Voice Dictation'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!previewImage && !promptText.trim())}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>ANALYZING...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>RUN JARVIS CO-PILOT</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Instant Presets for Benchmark Evaluation */}
      <div className="pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            ⚡ Quick Incident & Medicine Presets (Instant Red Cross/WHO Triage):
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">1-Click Evaluation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PRESET_CASES.map((preset) => {
            const isFirstAid = preset.mode === 'INJURY_FIRST_AID';
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className="p-2.5 rounded-xl text-left border bg-slate-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {preset.id === 'scald-burn' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                  {preset.id === 'deep-laceration' && <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
                  {preset.id === 'cardiac-arrest' && <Heart className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
                  {preset.id === 'ankle-sprain' && <Activity className="w-3.5 h-3.5 text-indigo-400" />}
                  {preset.id === 'medicine-amoxicillin' && <Pill className="w-3.5 h-3.5 text-cyan-400" />}
                  {preset.id === 'medicine-metformin' && <Stethoscope className="w-3.5 h-3.5 text-teal-400" />}
                  <span className={`text-[10px] font-mono font-bold uppercase ${isFirstAid ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {preset.category}
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 line-clamp-1">
                  {preset.title.split('(')[0]}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {preset.data.headline_title}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
