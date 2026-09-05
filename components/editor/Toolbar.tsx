"use client";

import { useEditorStore } from "@/store/editorStore";
import { PlayIcon, SplitIcon, TextIcon, TrashIcon } from "@/components/icons";
import AspectRatioSelect from "./AspectRatioSelect";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

export default function Toolbar() {
  const project = useEditorStore((s) => s.project);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const playheadSec = useEditorStore((s) => s.playheadSec);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const splitClip = useEditorStore((s) => s.splitClip);
  const removeClip = useEditorStore((s) => s.removeClip);
  const addTextClip = useEditorStore((s) => s.addTextClip);

  return (
    <div
      className="flex items-center gap-3 px-4 py-2"
      style={{ borderTop: "2px solid var(--color-divider)", borderBottom: "2px solid var(--color-divider)" }}
    >
      <button onClick={() => setIsPlaying(!isPlaying)} className="btn btn-primary btn-icon" aria-label="Play">
        {isPlaying ? (
          <span style={{ width: 12, height: 12, background: "var(--color-bg)", display: "block" }} />
        ) : (
          <PlayIcon size={15} />
        )}
      </button>
      <span style={{ font: "600 13px var(--font-mono)" }}>
        {fmt(playheadSec)}
        <span className="text-muted"> / {fmt(project?.durationSec ?? 0)}</span>
      </span>

      <div style={{ width: 1, height: 22, background: "var(--color-divider)" }} />

      <button
        disabled={!selectedClipId}
        onClick={() => selectedClipId && splitClip(selectedClipId, playheadSec)}
        className="btn btn-secondary"
        style={{ fontSize: 12, gap: 7 }}
      >
        <SplitIcon size={14} />
        Split at playhead
      </button>
      <button onClick={() => addTextClip(playheadSec)} className="btn btn-secondary" style={{ fontSize: 12, gap: 7 }}>
        <TextIcon size={14} />
        Add text
      </button>

      <div style={{ width: 1, height: 22, background: "var(--color-divider)" }} />
      <AspectRatioSelect />

      <button
        disabled={!selectedClipId}
        onClick={() => selectedClipId && removeClip(selectedClipId)}
        className="btn btn-secondary"
        style={{ fontSize: 12, gap: 7, marginLeft: "auto" }}
      >
        <TrashIcon size={14} />
        Delete clip
      </button>
    </div>
  );
}
