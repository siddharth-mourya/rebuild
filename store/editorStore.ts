import { create } from "zustand";
import type { AspectRatio, Clip, MediaAsset, Project, TrackKind } from "@/lib/timeline/types";
import * as engine from "@/lib/timeline/timelineEngine";
import { saveProject } from "@/lib/storage/projectStore";
import { listAssets } from "@/lib/storage/assetStore";

const HISTORY_LIMIT = 50;

/** Fills in fields added after a project may have been saved, so older saved projects still load cleanly. */
function normalizeProject(project: Project): Project {
  const aspectRatio = project.aspectRatio ?? "9:16";
  const hasTextTrack = project.tracks.some((t) => t.kind === "text");
  const tracks = hasTextTrack
    ? project.tracks
    : [...project.tracks, { id: crypto.randomUUID(), kind: "text" as const, name: "Text", clips: [] }];
  return { ...project, aspectRatio, tracks };
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

type EditorState = {
  project: Project | null;
  assets: Map<string, MediaAsset>;
  selectedClipId: string | null;
  highlightedAssetId: string | null;
  playheadSec: number;
  isPlaying: boolean;
  saveStatus: SaveStatus;
  past: Project[];

  loadInto: (project: Project) => Promise<void>;
  selectClip: (clipId: string | null) => void;
  setHighlightedAsset: (assetId: string | null) => void;
  setPlayhead: (sec: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  renameProject: (name: string) => void;

  /** Snapshots the current project onto the undo stack — call once before a drag gesture starts. */
  pushHistory: () => void;
  undo: () => void;

  addTrack: (kind: TrackKind, name: string) => void;
  addClip: (trackId: string, clip: Omit<Clip, "id" | "trackId">) => void;
  addTextClip: (atTime: number) => void;
  updateClip: (clipId: string, patch: Partial<Clip>) => void;
  removeClip: (clipId: string) => void;
  moveClip: (clipId: string, newStart: number) => void;
  trimClipStart: (clipId: string, desiredStart: number) => void;
  trimClipEnd: (clipId: string, desiredEnd: number) => void;
  splitClip: (clipId: string, atTime: number) => void;

  registerAsset: (asset: MediaAsset) => void;
};

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

async function runSave(get: () => EditorState, set: (partial: Partial<EditorState>) => void) {
  const project = get().project;
  if (!project) return;
  set({ saveStatus: "saving" });
  try {
    await saveProject(project);
    set({ saveStatus: "saved" });
  } catch {
    set({ saveStatus: "error" });
  }
}

function scheduleAutosave(get: () => EditorState, set: (partial: Partial<EditorState>) => void) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => runSave(get, set), 800);
}

/**
 * Saves immediately instead of waiting out the debounce — call this before navigating away from
 * the editor (e.g. the "Projects" back button), otherwise an edit made just before leaving can be
 * lost if the 800ms autosave hasn't fired yet.
 */
export async function flushAutosave(): Promise<void> {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  await runSave(useEditorStore.getState, useEditorStore.setState);
}

/** Snapshots the current project onto the undo stack before a discrete (non-drag) edit. */
function snapshot(get: () => EditorState, set: (partial: Partial<EditorState>) => void) {
  const project = get().project;
  if (!project) return;
  const past = [...get().past, project].slice(-HISTORY_LIMIT);
  set({ past });
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  assets: new Map(),
  selectedClipId: null,
  highlightedAssetId: null,
  playheadSec: 0,
  isPlaying: false,
  saveStatus: "idle",
  past: [],

  loadInto: async (project) => {
    const assetList = await listAssets(project.id);
    set({
      project: normalizeProject(project),
      assets: new Map(assetList.map((a) => [a.id, a])),
      selectedClipId: null,
      playheadSec: 0,
      saveStatus: "idle",
      past: [],
    });
  },

  selectClip: (clipId) => set({ selectedClipId: clipId }),
  setAspectRatio: (ratio) => {
    const project = get().project;
    if (!project) return;
    snapshot(get, set);
    set({ project: { ...project, aspectRatio: ratio, updatedAt: Date.now() } });
    scheduleAutosave(get, set);
  },
  renameProject: (name) => {
    const project = get().project;
    if (!project) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name) return;
    snapshot(get, set);
    set({ project: { ...project, name: trimmed, updatedAt: Date.now() } });
    scheduleAutosave(get, set);
  },
  setHighlightedAsset: (assetId) =>
    set((s) => ({ highlightedAssetId: s.highlightedAssetId === assetId ? null : assetId })),
  setPlayhead: (sec) => set({ playheadSec: Math.max(0, sec) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  pushHistory: () => snapshot(get, set),
  undo: () => {
    const { past, project } = get();
    if (past.length === 0 || !project) return;
    const previous = past[past.length - 1];
    set({ project: previous, past: past.slice(0, -1) });
    scheduleAutosave(get, set);
  },

  addTrack: (kind, name) => {
    const project = get().project;
    if (!project) return;
    snapshot(get, set);
    set({ project: engine.addTrack(project, kind, name) });
    scheduleAutosave(get, set);
  },

  addClip: (trackId, clip) => {
    const project = get().project;
    if (!project) return;
    snapshot(get, set);
    const next = engine.addClip(project, trackId, clip);
    const added = next.tracks
      .find((t) => t.id === trackId)
      ?.clips.find((c) => c.timelineStart === clip.timelineStart && c.assetId === clip.assetId);
    set({ project: next, selectedClipId: added?.id ?? get().selectedClipId });
    scheduleAutosave(get, set);
  },

  addTextClip: (atTime) => {
    const project = get().project;
    if (!project) return;
    const textTrack = project.tracks.find((t) => t.kind === "text");
    if (!textTrack) return;
    snapshot(get, set);
    const duration = 3;
    const start = engine.findFreeSlot(textTrack.clips, atTime, duration);
    const next = engine.addClip(project, textTrack.id, {
      timelineStart: start,
      timelineEnd: start + duration,
      sourceIn: 0,
      sourceOut: duration,
      text: "Your text",
      textColor: "#ffffff",
      fontSize: 32,
      x: 0.5,
      y: 0.8,
    });
    const added = next.tracks.find((t) => t.id === textTrack.id)?.clips.find((c) => c.timelineStart === start);
    set({ project: next, selectedClipId: added?.id ?? null });
    scheduleAutosave(get, set);
  },

  updateClip: (clipId, patch) => {
    const project = get().project;
    if (!project) return;
    snapshot(get, set);
    set({ project: engine.updateClip(project, clipId, patch) });
    scheduleAutosave(get, set);
  },

  removeClip: (clipId) => {
    const project = get().project;
    if (!project) return;
    snapshot(get, set);
    const selectedClipId = get().selectedClipId === clipId ? null : get().selectedClipId;
    set({ project: engine.removeClip(project, clipId), selectedClipId });
    scheduleAutosave(get, set);
  },

  // Drag gestures (move/trim) call these many times per drag via pointermove — history is
  // snapshotted once up front by the caller (ClipView, on pointerdown), not on every move.
  moveClip: (clipId, newStart) => {
    const project = get().project;
    if (!project) return;
    set({ project: engine.moveClip(project, clipId, newStart) });
    scheduleAutosave(get, set);
  },

  trimClipStart: (clipId, desiredStart) => {
    const project = get().project;
    if (!project) return;
    set({ project: engine.trimClipStart(project, clipId, desiredStart) });
    scheduleAutosave(get, set);
  },

  trimClipEnd: (clipId, desiredEnd) => {
    const project = get().project;
    if (!project) return;
    set({ project: engine.trimClipEnd(project, clipId, desiredEnd) });
    scheduleAutosave(get, set);
  },

  splitClip: (clipId, atTime) => {
    const project = get().project;
    if (!project) return;
    snapshot(get, set);
    set({ project: engine.splitClip(project, clipId, atTime) });
    scheduleAutosave(get, set);
  },

  registerAsset: (asset) => {
    set((s) => {
      const assets = new Map(s.assets);
      assets.set(asset.id, asset);
      return { assets };
    });
  },
}));
