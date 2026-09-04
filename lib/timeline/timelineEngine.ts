import type { Clip, Project, Track, TrackKind } from "./types";

/** Pure functions that operate on a Project. No side effects, no storage — the store calls these and persists the result. */

const MIN_CLIP_DURATION = 0.2;

/**
 * The nearest neighboring clip boundaries on either side of `clip` within `track` — i.e. the
 * end of whatever sits immediately before it and the start of whatever sits immediately after,
 * based on `clip`'s own current position. Used for trimming an edge, where only that one edge
 * moves and it inherently can't jump past another clip.
 */
function neighborBounds(track: Track, clip: Clip): { left: number; right: number } {
  let left = 0;
  let right = Infinity;
  for (const other of track.clips) {
    if (other.id === clip.id) continue;
    if (other.timelineEnd <= clip.timelineStart) left = Math.max(left, other.timelineEnd);
    if (other.timelineStart >= clip.timelineEnd) right = Math.min(right, other.timelineStart);
  }
  return { left, right };
}

/** Every gap on the track (excluding `excludeId`) big enough to matter, including before the first clip and after the last. */
function freeIntervals(clips: Clip[], excludeId: string): { start: number; end: number }[] {
  const sorted = clips.filter((c) => c.id !== excludeId).sort((a, b) => a.timelineStart - b.timelineStart);
  const intervals: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const c of sorted) {
    if (c.timelineStart > cursor) intervals.push({ start: cursor, end: c.timelineStart });
    cursor = Math.max(cursor, c.timelineEnd);
  }
  intervals.push({ start: cursor, end: Infinity });
  return intervals;
}

export function recomputeDuration(project: Project): number {
  let max = 0;
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      if (clip.timelineEnd > max) max = clip.timelineEnd;
    }
  }
  return max;
}

export function addTrack(project: Project, kind: TrackKind, name: string): Project {
  const track: Track = { id: crypto.randomUUID(), kind, name, clips: [] };
  return { ...project, tracks: [...project.tracks, track], updatedAt: Date.now() };
}

/** Finds the earliest start >= desiredStart where a clip of `duration` fits without overlapping existing clips. */
export function findFreeSlot(clips: Clip[], desiredStart: number, duration: number): number {
  const sorted = [...clips].sort((a, b) => a.timelineStart - b.timelineStart);
  let start = Math.max(0, desiredStart);
  for (const c of sorted) {
    if (start < c.timelineEnd && start + duration > c.timelineStart) start = c.timelineEnd;
  }
  return start;
}

export function addClip(project: Project, trackId: string, clip: Omit<Clip, "id" | "trackId">): Project {
  const newClip: Clip = { ...clip, id: crypto.randomUUID(), trackId };
  const tracks = project.tracks.map((t) =>
    t.id === trackId ? { ...t, clips: [...t.clips, newClip].sort((a, b) => a.timelineStart - b.timelineStart) } : t
  );
  const next = { ...project, tracks, updatedAt: Date.now() };
  return { ...next, durationSec: recomputeDuration(next) };
}

export function updateClip(project: Project, clipId: string, patch: Partial<Clip>): Project {
  const tracks = project.tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...patch } : c)),
  }));
  const next = { ...project, tracks, updatedAt: Date.now() };
  return { ...next, durationSec: recomputeDuration(next) };
}

export function removeClip(project: Project, clipId: string): Project {
  const tracks = project.tracks.map((t) => ({
    ...t,
    clips: t.clips.filter((c) => c.id !== clipId),
  }));
  const next = { ...project, tracks, updatedAt: Date.now() };
  return { ...next, durationSec: recomputeDuration(next) };
}

/**
 * Moves a clip to a new start time. Clamped to whichever free gap on the track best fits the
 * desired position — not just the clip's current gap — so it can be dragged clean across other
 * clips into a distant empty spot (e.g. one left behind by deleting a different clip) rather than
 * only sliding within its immediate neighbors.
 */
export function moveClip(project: Project, clipId: string, newTimelineStart: number): Project {
  const tracks = project.tracks.map((t) => {
    const clip = t.clips.find((c) => c.id === clipId);
    if (!clip) return t;
    const duration = clip.timelineEnd - clip.timelineStart;
    const target = Math.max(0, newTimelineStart);

    let start = 0;
    let bestDistance = Infinity;
    for (const interval of freeIntervals(t.clips, clipId)) {
      if (interval.end - interval.start < duration) continue;
      const candidate = Math.max(interval.start, Math.min(target, interval.end - duration));
      const distance = Math.abs(candidate - target);
      if (distance < bestDistance) {
        bestDistance = distance;
        start = candidate;
      }
    }

    return {
      ...t,
      clips: t.clips.map((c) => (c.id === clipId ? { ...c, timelineStart: start, timelineEnd: start + duration } : c)),
    };
  });
  const next = { ...project, tracks, updatedAt: Date.now() };
  return { ...next, durationSec: recomputeDuration(next) };
}

/** Drags a clip's left edge, clamped so it can't cross its left neighbor or invert past its own right edge. */
export function trimClipStart(project: Project, clipId: string, desiredStart: number): Project {
  const tracks = project.tracks.map((t) => {
    const clip = t.clips.find((c) => c.id === clipId);
    if (!clip) return t;
    const { left } = neighborBounds(t, clip);
    const maxStart = clip.timelineEnd - MIN_CLIP_DURATION;
    const start = Math.max(left, Math.min(desiredStart, maxStart));
    const sourceShift = start - clip.timelineStart;
    return {
      ...t,
      clips: t.clips.map((c) =>
        c.id === clipId ? { ...c, timelineStart: start, sourceIn: c.sourceIn + sourceShift } : c
      ),
    };
  });
  const next = { ...project, tracks, updatedAt: Date.now() };
  return { ...next, durationSec: recomputeDuration(next) };
}

/** Drags a clip's right edge, clamped so it can't cross its right neighbor or invert past its own left edge. */
export function trimClipEnd(project: Project, clipId: string, desiredEnd: number): Project {
  const tracks = project.tracks.map((t) => {
    const clip = t.clips.find((c) => c.id === clipId);
    if (!clip) return t;
    const { right } = neighborBounds(t, clip);
    const minEnd = clip.timelineStart + MIN_CLIP_DURATION;
    const end = Math.max(minEnd, Math.min(desiredEnd, right));
    const sourceShift = end - clip.timelineEnd;
    return {
      ...t,
      clips: t.clips.map((c) =>
        c.id === clipId ? { ...c, timelineEnd: end, sourceOut: c.sourceOut + sourceShift } : c
      ),
    };
  });
  const next = { ...project, tracks, updatedAt: Date.now() };
  return { ...next, durationSec: recomputeDuration(next) };
}

/** Split a clip at a given timeline position into two clips. */
export function splitClip(project: Project, clipId: string, atTime: number): Project {
  const tracks = project.tracks.map((t) => {
    const idx = t.clips.findIndex((c) => c.id === clipId);
    if (idx === -1) return t;
    const c = t.clips[idx];
    if (atTime <= c.timelineStart || atTime >= c.timelineEnd) return t;

    const sourceSplitPoint = c.sourceIn + (atTime - c.timelineStart);
    const left: Clip = { ...c, timelineEnd: atTime, sourceOut: sourceSplitPoint };
    const right: Clip = {
      ...c,
      id: crypto.randomUUID(),
      timelineStart: atTime,
      sourceIn: sourceSplitPoint,
    };
    const clips = [...t.clips];
    clips.splice(idx, 1, left, right);
    return { ...t, clips };
  });
  const next = { ...project, tracks, updatedAt: Date.now() };
  return { ...next, durationSec: recomputeDuration(next) };
}
