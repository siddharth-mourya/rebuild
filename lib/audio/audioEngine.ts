import type { Clip } from "../timeline/types";

/** Computes the effective 0..1 gain for an audio clip at a given position inside it, applying fade in/out. */
export function effectiveVolume(clip: Clip, localTimeSec: number): number {
  const base = clip.volume ?? 1;
  const length = clip.timelineEnd - clip.timelineStart;
  const fadeIn = clip.fadeInSec ?? 0;
  const fadeOut = clip.fadeOutSec ?? 0;

  let mult = 1;
  if (fadeIn > 0 && localTimeSec < fadeIn) {
    mult = Math.min(mult, localTimeSec / fadeIn);
  }
  const timeFromEnd = length - localTimeSec;
  if (fadeOut > 0 && timeFromEnd < fadeOut) {
    mult = Math.min(mult, Math.max(0, timeFromEnd / fadeOut));
  }
  return base * mult;
}

/**
 * Owns one AudioContext and a GainNode per <video>/<audio> element registered with it, so
 * PreviewPlayer can route every track through Web Audio for live volume/fade during playback
 * without re-decoding anything.
 */
export class AudioMixer {
  private ctx: AudioContext | null = null;
  private gains = new Map<string, GainNode>();
  private sources = new Map<string, MediaElementAudioSourceNode>();

  private getContext(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  /** Call once per <video>/<audio> element (e.g. on mount) — routes it through a dedicated GainNode. */
  register(clipId: string, element: HTMLMediaElement): GainNode {
    const existing = this.gains.get(clipId);
    if (existing) return existing;

    const ctx = this.getContext();
    const source = ctx.createMediaElementSource(element);
    const gain = ctx.createGain();
    source.connect(gain).connect(ctx.destination);

    this.sources.set(clipId, source);
    this.gains.set(clipId, gain);
    return gain;
  }

  setVolume(clipId: string, value: number): void {
    const gain = this.gains.get(clipId);
    if (gain) gain.gain.value = Math.max(0, Math.min(1, value));
  }

  unregister(clipId: string): void {
    this.sources.get(clipId)?.disconnect();
    this.gains.get(clipId)?.disconnect();
    this.sources.delete(clipId);
    this.gains.delete(clipId);
  }

  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === "suspended") await this.ctx.resume();
  }
}
