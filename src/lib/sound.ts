// Lightweight Web Audio sound manager — no assets required.
// Generates retro chiptune-style blips, sweeps and tones on the fly.

type SoundName =
  | "move"
  | "merge"
  | "eat"
  | "crash"
  | "click"
  | "win"
  | "lose"
  | "flip"
  | "match"
  | "nomatch"
  | "tick"
  | "start"
  | "achievement"
  | "hover"

class SoundManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  enabled = true
  volume = 0.35

  private ensure() {
    if (typeof window === "undefined") return null
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      if (!AC) return null
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === "suspended") void this.ctx.resume()
    return this.ctx
  }

  setEnabled(v: boolean) {
    this.enabled = v
  }

  setVolume(v: number) {
    this.volume = v
    if (this.master) this.master.gain.value = v
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = "square",
    when = 0,
    gainPeak = 0.5,
    freqEnd?: number
  ) {
    const ctx = this.ensure()
    if (!ctx || !this.master || !this.enabled) return
    const t0 = ctx.currentTime + when
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, freqEnd),
        t0 + duration
      )
    }
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(g)
    g.connect(this.master)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
  }

  private noise(duration: number, when = 0, gainPeak = 0.4) {
    const ctx = this.ensure()
    if (!ctx || !this.master || !this.enabled) return
    const t0 = ctx.currentTime + when
    const bufferSize = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const g = ctx.createGain()
    g.gain.setValueAtTime(gainPeak, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.value = 1200
    src.connect(filter)
    filter.connect(g)
    g.connect(this.master)
    src.start(t0)
    src.stop(t0 + duration)
  }

  play(name: SoundName) {
    if (!this.enabled) return
    switch (name) {
      case "move":
        this.tone(220, 0.06, "square", 0, 0.25)
        break
      case "click":
        this.tone(440, 0.05, "square", 0, 0.3)
        break
      case "hover":
        this.tone(660, 0.03, "sine", 0, 0.1)
        break
      case "merge":
        this.tone(330, 0.08, "square", 0, 0.35)
        this.tone(495, 0.1, "square", 0.05, 0.3)
        break
      case "eat":
        this.tone(523, 0.06, "square", 0, 0.4)
        this.tone(784, 0.08, "square", 0.05, 0.3)
        break
      case "crash":
        this.noise(0.25, 0, 0.5)
        this.tone(160, 0.25, "sawtooth", 0, 0.4, 60)
        break
      case "win":
        this.tone(523, 0.12, "square", 0, 0.4)
        this.tone(659, 0.12, "square", 0.12, 0.4)
        this.tone(784, 0.12, "square", 0.24, 0.4)
        this.tone(1047, 0.25, "square", 0.36, 0.4)
        break
      case "lose":
        this.tone(440, 0.18, "sawtooth", 0, 0.4, 220)
        this.tone(220, 0.35, "sawtooth", 0.15, 0.4, 110)
        break
      case "flip":
        this.tone(600, 0.05, "triangle", 0, 0.3)
        break
      case "match":
        this.tone(660, 0.08, "square", 0, 0.4)
        this.tone(880, 0.12, "square", 0.07, 0.4)
        break
      case "nomatch":
        this.tone(300, 0.12, "sawtooth", 0, 0.3, 180)
        break
      case "tick":
        this.tone(880, 0.03, "sine", 0, 0.15)
        break
      case "start":
        this.tone(392, 0.1, "square", 0, 0.4)
        this.tone(523, 0.1, "square", 0.1, 0.4)
        this.tone(784, 0.15, "square", 0.2, 0.4)
        break
      case "achievement":
        this.tone(659, 0.1, "triangle", 0, 0.4)
        this.tone(880, 0.1, "triangle", 0.1, 0.4)
        this.tone(1175, 0.2, "triangle", 0.2, 0.4)
        break
    }
  }
}

export const sound = new SoundManager()
