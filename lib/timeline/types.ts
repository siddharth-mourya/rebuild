// Core project/timeline data model. Everything the editor persists lives in this shape.

export type MediaKind = "video" | "image" | "audio";

export type MediaAsset = {
  id: string;
  projectId: string;
  kind: MediaKind;
  name: string;
  /** key into the IndexedDB `assets` object store where the Blob is kept */
  blobKey: string;
  durationSec?: number;
  width?: number;
  height?: number;
  createdAt: number;
};

export type TrackKind = "video" | "audio" | "text";

export type Clip = {
  id: string;
  trackId: string;
  /** text clips have no underlying MediaAsset — everything else does */
  assetId?: string;
  /** position on the overall project timeline, in seconds */
  timelineStart: number;
  timelineEnd: number;
  /** trim range within the source asset, in seconds (unused by text clips) */
  sourceIn: number;
  sourceOut: number;
  /** video clips only: mute the asset's original audio */
  muted?: boolean;
  /** audio clips only */
  volume?: number; // 0..1, default 1
  fadeInSec?: number;
  fadeOutSec?: number;
  /** text track only */
  text?: string;
  textColor?: string; // default "#ffffff"
  fontSize?: number; // px, default 32
  /** text track only: position on the canvas, 0..1 fractions, default 0.5/0.8 */
  x?: number;
  y?: number;
  /**
   * video/image clips: how the source fills the preview frame.
   * "fill" = auto-cover, centered, no manual adjustment.
   * "crop" = cover with a manual zoom/focus-point control.
   * "fit" = contain, letterboxed.
   * Default "fill".
   */
  fit?: "fill" | "crop" | "fit";
  /** video/image clips, "crop" mode only: manual crop position and zoom */
  zoom?: number; // 1 = no zoom, >1 = zoomed in. Default 1.
  focusX?: number; // 0..1, default 0.5 (center)
  focusY?: number; // 0..1, default 0.5 (center)
};

export type Track = {
  id: string;
  kind: TrackKind;
  name: string;
  clips: Clip[];
};

export type AspectRatio = "9:16" | "1:1" | "4:5" | "16:9";

export const ASPECT_RATIOS: { value: AspectRatio; label: string; ratio: number }[] = [
  { value: "9:16", label: "9:16 — Reels/Stories", ratio: 9 / 16 },
  { value: "1:1", label: "1:1 — Square", ratio: 1 },
  { value: "4:5", label: "4:5 — Portrait feed", ratio: 4 / 5 },
  { value: "16:9", label: "16:9 — Landscape", ratio: 16 / 9 },
];

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tracks: Track[];
  durationSec: number;
  aspectRatio: AspectRatio;
};

export function emptyProject(id: string, name: string): Project {
  const now = Date.now();
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    durationSec: 0,
    aspectRatio: "9:16",
    tracks: [
      { id: crypto.randomUUID(), kind: "video", name: "Video", clips: [] },
      { id: crypto.randomUUID(), kind: "text", name: "Text", clips: [] },
      { id: crypto.randomUUID(), kind: "audio", name: "Audio", clips: [] },
    ],
  };
}
