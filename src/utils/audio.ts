// Web Audio API Synthesizer for low-latency clinical sound effects and CPR metronome
class SoundController {
  private ctx: AudioContext | null = null;
  private metronomeTimer: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a gentle, calming reassurance chime
  playCalmChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, now); // 528Hz calming solfeggio frequency
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Play crisp metronome beat for CPR (100-120 BPM)
  playMetronomeClick(accent: boolean = false) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = accent ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(accent ? 880 : 440, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio fallback
    }
  }

  // Start continuous CPR Metronome at target BPM
  startCPRMetronome(bpm: number = 110, onTick?: (count: number) => void) {
    this.stopCPRMetronome();
    this.initCtx();
    const intervalMs = (60 / bpm) * 1000;
    let count = 0;

    // First beat immediate
    count++;
    this.playMetronomeClick(count === 1);
    if (onTick) onTick(count);

    this.metronomeTimer = window.setInterval(() => {
      count = count >= 30 ? 1 : count + 1; // CPR 30-compression cycle
      this.playMetronomeClick(count === 1);
      if (onTick) onTick(count);
    }, intervalMs);
  }

  stopCPRMetronome() {
    if (this.metronomeTimer !== null) {
      clearInterval(this.metronomeTimer);
      this.metronomeTimer = null;
    }
  }

  // Completion chime for cooling/pressure timers
  playCompleteFanfare() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.15, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    } catch {
      // Audio fallback
    }
  }

  // Emergency Siren pulse for 911 dispatch
  playEmergencyAlert() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.25);
      osc.frequency.linearRampToValueAtTime(600, now + 0.5);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Audio fallback
    }
  }
}

export const soundCtrl = new SoundController();
