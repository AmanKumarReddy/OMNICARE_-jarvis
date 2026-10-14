// Web Speech API wrapper for smooth, calming Text-To-Speech (TTS) and Speech Recognition (STT)

export class SpeechController {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  // Speak text with calming, soothing prosody (slightly reduced pitch and rate for stress reduction)
  speak(text: string, onEnd?: () => void) {
    if (!this.synth) return;

    this.stop();

    // Sanitize any stray symbols, asterisks, hashes, brackets for 100% natural voice readout
    const cleanText = text
      .replace(/[*_#`~[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.92; // Slightly measured rate to calm anxious or elderly users
    utterance.pitch = 0.98; // Soothing, warm natural pitch

    // Prefer high quality English voice if available
    const voices = this.synth.getVoices();
    const naturalVoice = voices.find(
      v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Serena')) && v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

export const speechCtrl = new SpeechController();

// Speech Recognition helper for hands-free emergency queries
export function createSpeechRecognizer(
  onResult: (transcript: string) => void,
  onError: (err: any) => void
) {
  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRec) {
    return null;
  }
  const recognizer = new SpeechRec();
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.lang = 'en-US';

  recognizer.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognizer.onerror = (event: any) => {
    onError(event.error);
  };

  return recognizer;
}
