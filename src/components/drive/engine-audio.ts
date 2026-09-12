'use client';

import type { Engine } from '@/content/drive-vehicles';

/**
 * Engine note and horn, synthesised.
 *
 * No samples. A convincing engine loop is a few hundred KB of audio that has to
 * be pitch-shifted to track revs anyway, and pitch-shifting a recording is
 * exactly where browser engine sounds usually start sounding wrong. Building the
 * note from oscillators means the pitch IS the revs, so it can never drift out
 * of step with what the car is doing, and it costs nothing to download.
 *
 * An engine is a periodic bang, not a tone, so this is stacked harmonics through
 * a lowpass whose cutoff opens with throttle — which is most of what makes the
 * difference between "accelerating" and "getting louder". Road noise is filtered
 * white noise that tracks speed rather than revs, so it stays up when you lift
 * off and the engine note drops.
 *
 * Every parameter change goes through `setTargetAtTime` rather than a direct
 * assignment. Assigning to an AudioParam mid-stream steps it discontinuously,
 * which is audible as a click on every single frame.
 */

/** Speed at which the engine is considered to be at full chat. */
const SPEED_AT_REDLINE = 88;

/** How quickly parameters chase their target. Small = tight, large = laggy. */
const SMOOTHING = 0.06;

export class EngineAudio {
  /*
    The voice is fixed for the life of the instance: the car is chosen before
    the engine starts, so there is no case where the harmonic stack has to
    change under a running oscillator — which would mean rebuilding the graph
    mid-note and hearing the seam.
  */
  private readonly profile: Engine;

  constructor(profile: Engine) {
    this.profile = profile;
  }

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private noise: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private hornGain: GainNode | null = null;
  private hornOscillators: OscillatorNode[] = [];
  private muted = false;
  private running = false;

  /** Must be called from a user gesture, or the context starts suspended. */
  start(): void {
    if (this.running) return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    this.ctx = ctx;
    this.running = true;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(ctx.destination);

    /* ── Engine ── */
    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = this.profile.cutoffBase;
    this.lowpass.Q.value = 3.5;

    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;

    this.lowpass.connect(this.engineGain);
    this.engineGain.connect(this.master);

    for (const partial of this.profile.partials) {
      const osc = ctx.createOscillator();
      osc.type = partial.type;
      osc.frequency.value = this.profile.idleHz * partial.ratio;
      osc.detune.value = partial.detune;
      const gain = ctx.createGain();
      gain.gain.value = partial.gain;
      osc.connect(gain);
      gain.connect(this.lowpass);
      osc.start();
      this.oscillators.push(osc);
    }

    /* ── Road and wind noise ── */
    const seconds = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    /* Brown-ish noise: white noise integrated. Plain white is hiss; this has
       the low-frequency weight that reads as tyres on tarmac. */
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    this.noise = ctx.createBufferSource();
    this.noise.buffer = buffer;
    this.noise.loop = true;

    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.value = 700;
    this.noiseFilter.Q.value = 0.7;

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0;

    this.noise.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.master);
    this.noise.start();

    /* ── Horn ──
       Two tones a little under a major third apart, which is roughly what a real
       twin-tone horn is, and why one note alone sounds like a test signal. */
    this.hornGain = ctx.createGain();
    this.hornGain.gain.value = 0;
    this.hornGain.connect(this.master);

    for (const hz of this.profile.horn) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = hz;
      const shaped = ctx.createBiquadFilter();
      shaped.type = 'lowpass';
      shaped.frequency.value = 2200;
      osc.connect(shaped);
      shaped.connect(this.hornGain);
      osc.start();
      this.hornOscillators.push(osc);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /**
   * Called every frame with the car's state.
   *
   * `throttle` is the driver's input, `speedKph` is what the car is actually
   * doing. Both matter: revs should rise the instant the pedal moves, before the
   * car has gone anywhere, which is what makes it feel connected.
   */
  update(speedKph: number, throttle: number, airborne: boolean): void {
    const ctx = this.ctx;
    if (!ctx || !this.lowpass || !this.engineGain || !this.noiseGain || !this.noiseFilter) return;

    const now = ctx.currentTime;
    const speed = Math.min(Math.abs(speedKph) / SPEED_AT_REDLINE, 1);
    const demand = Math.abs(throttle);

    /*
      Load, not just speed. A car pinned at low speed with the throttle open is
      revving hard; the same speed coasting is not. Airborne wheels spin up,
      which is the one time revs and speed genuinely disagree.
    */
    const revs = Math.min(speed * 0.78 + demand * 0.34 + (airborne ? 0.22 : 0), 1);
    const { idleHz, redlineHz, partials } = this.profile;
    const fundamental = idleHz + (redlineHz - idleHz) * revs;

    for (let i = 0; i < this.oscillators.length; i += 1) {
      const partial = partials[i];
      this.oscillators[i].frequency.setTargetAtTime(
        fundamental * partial.ratio,
        now,
        SMOOTHING,
      );
    }

    /* Opening the filter is what "accelerating" sounds like; volume alone is
       just the same note louder. */
    this.lowpass.frequency.setTargetAtTime(
      this.profile.cutoffBase + revs * this.profile.cutoffSweep + demand * this.profile.cutoffThrottle,
      now,
      SMOOTHING,
    );
    this.engineGain.gain.setTargetAtTime(0.1 + revs * 0.3 + demand * 0.1, now, SMOOTHING);

    /* Road noise follows the ground speed and cuts out when the wheels do. */
    this.noiseGain.gain.setTargetAtTime(airborne ? 0.015 : speed * this.profile.noise, now, 0.12);
    this.noiseFilter.frequency.setTargetAtTime(420 + speed * 1500, now, 0.12);
  }

  /** Held down rather than triggered, so leaning on it works. */
  horn(on: boolean): void {
    if (!this.ctx || !this.hornGain) return;
    /* A short ramp, not a step: an instant gain change on a running oscillator
       is a click at both ends. */
    this.hornGain.gain.setTargetAtTime(on ? 0.16 : 0, this.ctx.currentTime, on ? 0.008 : 0.03);
  }

  dispose(): void {
    for (const osc of [...this.oscillators, ...this.hornOscillators]) {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
      osc.disconnect();
    }
    this.oscillators = [];
    this.hornOscillators = [];
    try {
      this.noise?.stop();
    } catch {
      /* already stopped */
    }
    this.noise?.disconnect();
    void this.ctx?.close();
    this.ctx = null;
    this.running = false;
  }
}
