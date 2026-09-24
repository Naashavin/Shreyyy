// Single AudioContext gate for the whole experience. Everything is
// synthesized with the Web Audio API so we can fade volumes programmatically
// and sync swells to interaction milestones without shipping audio files.
// Swap the synth methods for buffer playback later if real tracks are added.

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private musicNodes: OscillatorNode[] = []
  private started = false
  muted = false

  /** Must be called from a user gesture (the tap gate). */
  async unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume()
      return
    }
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    this.ctx = new Ctor()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.9
    this.master.connect(this.ctx.destination)
    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0
    this.musicGain.connect(this.master)
    if (this.ctx.state === "suspended") await this.ctx.resume()
  }

  private get now() {
    return this.ctx ? this.ctx.currentTime : 0
  }

  /** Warm ambient pad that fades in after the gate. */
  startMusic() {
    if (!this.ctx || !this.musicGain || this.started) return
    this.started = true
    // A soft, wide major-ish chord drone with slow detune movement.
    const freqs = [130.81, 196.0, 261.63, 329.63] // C3 G3 C4 E4
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator()
      osc.type = i % 2 === 0 ? "sine" : "triangle"
      osc.frequency.value = f
      const g = this.ctx!.createGain()
      g.gain.value = i === 0 ? 0.4 : 0.18

      // Slow LFO on detune for a living, breathing pad.
      const lfo = this.ctx!.createOscillator()
      lfo.frequency.value = 0.05 + i * 0.02
      const lfoGain = this.ctx!.createGain()
      lfoGain.gain.value = 4 + i
      lfo.connect(lfoGain)
      lfoGain.connect(osc.detune)

      osc.connect(g)
      g.connect(this.musicGain!)
      osc.start()
      lfo.start()
      this.musicNodes.push(osc, lfo)
    })
    this.fadeMusic(this.muted ? 0 : 0.5, 3)
  }

  fadeMusic(to: number, seconds: number) {
    if (!this.ctx || !this.musicGain) return
    const g = this.musicGain.gain
    g.cancelScheduledValues(this.now)
    g.setValueAtTime(Math.max(0.0001, g.value), this.now)
    g.linearRampToValueAtTime(to, this.now + seconds)
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (!this.master) return
    this.master.gain.cancelScheduledValues(this.now)
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.9, this.now + 0.4)
  }

  private envBlip(
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    dur: number,
    peak: number,
    delay = 0,
  ) {
    if (!this.ctx || !this.master) return
    const t0 = this.now + delay
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(startFreq, t0)
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + dur)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(peak, t0 + dur * 0.15)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g)
    g.connect(this.master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.05)
  }

  /** Breathy filtered-noise whoosh for a candle being blown out. */
  whoosh(delay = 0) {
    if (!this.ctx || !this.master) return
    const t0 = this.now + delay
    const dur = 0.55
    const buffer = this.ctx.createBuffer(
      1,
      this.ctx.sampleRate * dur,
      this.ctx.sampleRate,
    )
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.setValueAtTime(500, t0)
    filter.frequency.exponentialRampToValueAtTime(2600, t0 + dur)
    filter.Q.value = 0.7
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.08)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    src.connect(filter)
    filter.connect(g)
    g.connect(this.master)
    src.start(t0)
    src.stop(t0 + dur)
  }

  /** Bright rising chime for section transitions. */
  chime() {
    this.envBlip("sine", 660, 990, 0.5, 0.2, 0)
    this.envBlip("sine", 990, 1320, 0.6, 0.14, 0.08)
  }

  /** Short click for photo taps. */
  tap() {
    this.envBlip("triangle", 880, 440, 0.12, 0.16)
  }

  /** Sparkle cascade for the confetti burst. */
  celebrate() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
    notes.forEach((n, i) => this.envBlip("sine", n, n * 1.5, 0.5, 0.16, i * 0.06))
    this.fadeMusic(this.muted ? 0 : 0.7, 1.5)
  }
}

export const audio = new AudioEngine()
