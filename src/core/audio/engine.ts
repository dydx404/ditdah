/**
 * core/audio — Web Audio engine (the load-bearing wall).
 *
 * Plays a KeyingElement sequence as CW sidetone with sample-accurate timing.
 * All tone edges are scheduled ahead of time on the AudioContext clock; we
 * never use setTimeout for timing (jitter of tens of ms would wreck rhythm,
 * which is the very thing we teach).
 *
 * Signal path per playback:  Oscillator -> envelope Gain -> master Gain -> out
 * The envelope gain is automated with short linear ramps at every tone edge so
 * tones fade in/out over a few ms instead of clicking.
 *
 * The AudioContext is created lazily (first resume/play) so this module is safe
 * to import in non-browser environments (tests, SSR). The pure timing lives in
 * schedule.ts and is unit-tested; this file is the thin Web Audio glue.
 */
import type { KeyingElement } from '../morse/types'
import type { PlayHandle, ToneEngine } from './types'
import { buildSchedule } from './schedule'

/** Fade in/out per tone edge (seconds). ~5ms is inaudible but kills clicks. */
const RAMP_SEC = 0.005
/** Scheduling headroom so the first tone isn't scheduled in the past. */
const LOOKAHEAD_SEC = 0.05
/** Extra tail before stopping the oscillator, to let the last ramp complete. */
const TAIL_SEC = 0.02

type AudioCtxCtor = typeof AudioContext

function getAudioContextCtor(): AudioCtxCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    AudioContext?: AudioCtxCtor
    webkitAudioContext?: AudioCtxCtor
  }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

interface ActivePlayback {
  readonly osc: OscillatorNode
  readonly env: GainNode
  resolve: () => void
  settled: boolean
}

export class WebAudioToneEngine implements ToneEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private volume = 0.7
  private active: ActivePlayback | null = null

  private ensureContext(): { ctx: AudioContext; master: GainNode } {
    if (this.ctx && this.master) return { ctx: this.ctx, master: this.master }
    const Ctor = getAudioContextCtor()
    if (!Ctor) {
      throw new Error('Web Audio API is not available in this environment')
    }
    const ctx = new Ctor()
    const master = ctx.createGain()
    master.gain.value = this.volume
    master.connect(ctx.destination)
    this.ctx = ctx
    this.master = master
    return { ctx, master }
  }

  async resume(): Promise<void> {
    const { ctx } = this.ensureContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
  }

  play(elements: readonly KeyingElement[], toneHz: number): PlayHandle {
    // A new sequence always interrupts whatever is playing.
    this.stop()

    const { ctx, master } = this.ensureContext()
    const startSec = ctx.currentTime + LOOKAHEAD_SEC
    const schedule = buildSchedule(elements, startSec)

    let resolveDone!: () => void
    const done = new Promise<void>((resolve) => {
      resolveDone = resolve
    })

    // Nothing to sound (empty / all-silence): resolve on the next tick.
    if (schedule.windows.length === 0) {
      queueMicrotask(resolveDone)
      return { done, stop: () => {} }
    }

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = toneHz

    const env = ctx.createGain()
    env.gain.value = 0
    osc.connect(env)
    env.connect(master)

    // Gate the envelope on for each tone window with short linear ramps.
    for (const win of schedule.windows) {
      // Clamp the ramp so it never exceeds half the tone (very fast chars).
      const ramp = Math.min(RAMP_SEC, (win.endSec - win.startSec) / 2)
      env.gain.setValueAtTime(0, win.startSec)
      env.gain.linearRampToValueAtTime(1, win.startSec + ramp)
      env.gain.setValueAtTime(1, win.endSec - ramp)
      env.gain.linearRampToValueAtTime(0, win.endSec)
    }

    const stopAt = schedule.endSec + TAIL_SEC
    osc.start(startSec)
    osc.stop(stopAt)

    const playback: ActivePlayback = {
      osc,
      env,
      resolve: resolveDone,
      settled: false,
    }
    osc.onended = () => this.settle(playback)
    this.active = playback

    return {
      done,
      stop: () => {
        if (this.active === playback) this.stop()
      },
    }
  }

  stop(): void {
    const playback = this.active
    if (!playback || !this.ctx) return
    const now = this.ctx.currentTime
    // Ramp the envelope down from wherever it is, then stop the oscillator.
    try {
      playback.env.gain.cancelScheduledValues(now)
      playback.env.gain.setValueAtTime(playback.env.gain.value, now)
      playback.env.gain.linearRampToValueAtTime(0, now + RAMP_SEC)
      playback.osc.stop(now + RAMP_SEC + TAIL_SEC)
    } catch {
      // Oscillator may already be stopped; ignore.
    }
    this.settle(playback)
  }

  private settle(playback: ActivePlayback): void {
    if (playback.settled) return
    playback.settled = true
    try {
      playback.osc.disconnect()
      playback.env.disconnect()
    } catch {
      // already disconnected
    }
    if (this.active === playback) this.active = null
    playback.resolve()
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.master && this.ctx) {
      // Small ramp avoids a zipper-noise step on volume changes.
      const now = this.ctx.currentTime
      this.master.gain.setValueAtTime(this.master.gain.value, now)
      this.master.gain.linearRampToValueAtTime(this.volume, now + 0.02)
    }
  }

  dispose(): void {
    this.stop()
    if (this.ctx) {
      void this.ctx.close()
      this.ctx = null
      this.master = null
    }
  }
}
