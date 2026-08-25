export type SoundName = 'click' | 'hover' | 'toggle' | 'success' | 'open' | 'close';

interface Voice {
  /** Start frequency in Hz. */
  from: number;
  /** End frequency in Hz; the tone glides between the two. */
  to: number;
  /** Length in seconds. */
  duration: number;
  type: OscillatorType;
  /** Peak gain before the envelope decays. */
  gain: number;
}

/**
 * Voices for each UI sound.
 *
 * All short and mid-to-high, because low frequencies read as "something went
 * wrong" and anything past ~120ms starts to feel laggy behind a click. The
 * downward glides are the familiar "soft tap"; `success` rises instead, which is
 * the only place a confirmation is worth hearing.
 */
const VOICES: Record<SoundName, Voice[]> = {
  hover: [{ from: 900, to: 780, duration: 0.05, type: 'sine', gain: 0.05 }],
  click: [
    { from: 620, to: 380, duration: 0.07, type: 'triangle', gain: 0.16 },
    { from: 1500, to: 1200, duration: 0.035, type: 'sine', gain: 0.06 },
  ],
  toggle: [{ from: 480, to: 700, duration: 0.08, type: 'square', gain: 0.07 }],
  open: [{ from: 420, to: 820, duration: 0.11, type: 'sine', gain: 0.11 }],
  close: [{ from: 820, to: 420, duration: 0.1, type: 'sine', gain: 0.1 }],
  success: [
    { from: 660, to: 660, duration: 0.09, type: 'sine', gain: 0.13 },
    { from: 990, to: 990, duration: 0.14, type: 'sine', gain: 0.11 },
  ],
};

/**
 * Synthesises the interface sounds instead of loading audio files.
 *
 * Three reasons: it ships zero bytes, every sound can be tuned by editing a
 * number rather than re-exporting a wav, and there is no licensing question over
 * a sample. The whole engine is one lazily-created AudioContext and a handful of
 * oscillators that are discarded after they ring out.
 *
 * The context is created on first play, never at import — browsers start one in
 * a suspended state before a user gesture, and creating it eagerly on every page
 * load is what gets a site flagged as autoplaying.
 */
export class SoundEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = true;
  private volume = 0.7;
  /** Guards against a burst of identical sounds stacking into a click. */
  private lastPlayedAt = new Map<SoundName, number>();

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.context?.suspend().catch(() => undefined);
    else this.context?.resume().catch(() => undefined);
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.01);
    }
  }

  /** Resumes the context. Must be called from inside a user gesture. */
  async unlock(): Promise<void> {
    const context = this.ensureContext();
    if (context?.state === 'suspended') {
      await context.resume().catch(() => undefined);
    }
  }

  play(name: SoundName): void {
    if (this.muted) return;

    // Two of the same sound inside 40ms is a double-fire, not intent.
    const now = performance.now();
    const previous = this.lastPlayedAt.get(name) ?? 0;
    if (now - previous < 40) return;
    this.lastPlayedAt.set(name, now);

    const context = this.ensureContext();
    if (!context || !this.master) return;
    if (context.state === 'suspended') void context.resume().catch(() => undefined);

    const start = context.currentTime;

    for (const voice of VOICES[name]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = voice.type;
      oscillator.frequency.setValueAtTime(voice.from, start);
      if (voice.to !== voice.from) {
        oscillator.frequency.exponentialRampToValueAtTime(voice.to, start + voice.duration);
      }

      // Fast attack, exponential decay — a percussive envelope. Ramping to a
      // tiny value rather than 0 because exponential ramps cannot reach zero.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(voice.gain, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + voice.duration);

      oscillator.connect(gain);
      gain.connect(this.master);

      oscillator.start(start);
      oscillator.stop(start + voice.duration + 0.02);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
  }

  dispose(): void {
    this.context?.close().catch(() => undefined);
    this.context = null;
    this.master = null;
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    if (typeof window === 'undefined') return null;

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    try {
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
      return this.context;
    } catch {
      return null;
    }
  }
}

/** One engine per document — several would each hold their own AudioContext. */
export const soundEngine = new SoundEngine();
